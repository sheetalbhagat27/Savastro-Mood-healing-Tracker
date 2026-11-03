import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';
import { generateJwt } from '../src/utils/tokens.js';
import { createVerificationEmail } from '../src/templates/verificationEmail.js';
import { createWelcomeEmail } from '../src/templates/welcomeEmail.js';
import { createLoginNotificationEmail } from '../src/templates/loginNotificationEmail.js';
import { createPasswordResetEmail } from '../src/templates/passwordResetEmail.js';

let server;
let baseUrl;

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Helper for JSON requests
const post = async (endpoint, body, headers = {}) => {
  return fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
};

const get = async (endpoint, headers = {}) => {
  return fetch(`${baseUrl}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...headers }
  });
};

test('SECURITY: Protected endpoints reject requests with missing token (HTTP 401)', async () => {
  const endpoints = ['/api/auth/me', '/api/mood/today', '/api/activities', '/api/report'];

  for (const ep of endpoints) {
    const res = await get(ep);
    assert.equal(res.status, 401, `Expected 401 on unauthenticated access to ${ep}`);
    const data = await res.json();
    assert.ok(data.error);
  }
});

test('SECURITY: Legacy x-user header CANNOT bypass authentication', async () => {
  // Attacker attempts to impersonate another user via x-user header without a JWT
  const res = await get('/api/auth/me', {
    'x-user': 'victim@example.com'
  });

  assert.equal(res.status, 401, 'Spoofed x-user header must be rejected with 401');
  const data = await res.json();
  assert.match(data.error, /Authentication required/i);
});

test('SECURITY: Malformed, tampered, or expired tokens are rejected (HTTP 401)', async () => {
  // Malformed token
  const res1 = await get('/api/auth/me', {
    Authorization: 'Bearer invalid.token.payload'
  });
  assert.equal(res1.status, 401);

  // Tampered signature
  const fakeToken = jwt.sign({ id: '64b1f2e3c9d8a7b6c5d4e3f2' }, 'wrong_secret', { expiresIn: '1h' });
  const res2 = await get('/api/auth/me', {
    Authorization: `Bearer ${fakeToken}`
  });
  assert.equal(res2.status, 401);

  // Expired token
  const expiredToken = generateJwt('64b1f2e3c9d8a7b6c5d4e3f2', { expiresIn: '-1s' });
  const res3 = await get('/api/auth/me', {
    Authorization: `Bearer ${expiredToken}`
  });
  assert.equal(res3.status, 401);
  const data3 = await res3.json();
  assert.match(data3.error, /expired/i);
});

test('SECURITY: Cross-user data isolation (IDOR protection)', async () => {
  // 1. Register User A
  const regA = await post('/api/auth/register', {
    name: 'Alice User',
    email: 'alice@security-test.com',
    password: 'AliceStrongPassword1!'
  });
  assert.equal(regA.status, 201);
  const { token: tokenA } = await regA.json();

  // 2. Register User B
  const regB = await post('/api/auth/register', {
    name: 'Bob User',
    email: 'bob@security-test.com',
    password: 'BobStrongPassword1!'
  });
  assert.equal(regB.status, 201);
  const { token: tokenB } = await regB.json();

  // 3. User A creates an activity
  const actRes = await post(
    '/api/activities',
    { name: "Alice's Private Task", target: 5, seconds: 30 },
    { Authorization: `Bearer ${tokenA}` }
  );
  assert.equal(actRes.status, 201);
  const aliceTask = await actRes.json();
  const aliceTaskId = aliceTask._id || aliceTask.id;

  // 4. User B attempts to manipulate User A's task via IDOR
  const crossUpdateRes = await post(
    `/api/activities/${aliceTaskId}/progress`,
    { count: 5 },
    { Authorization: `Bearer ${tokenB}` }
  );
  assert.equal(crossUpdateRes.status, 404, 'User B must not be able to update User A activity');

  const crossCompleteRes = await post(
    `/api/activities/${aliceTaskId}/complete`,
    {},
    { Authorization: `Bearer ${tokenB}` }
  );
  assert.equal(crossCompleteRes.status, 404, 'User B must not be able to complete User A activity');

  // 5. User B attempts to access Alice's mood history
  await post('/api/mood', { mood: 'happy' }, { Authorization: `Bearer ${tokenA}` });

  const bobMoodRes = await get('/api/mood/today', {
    Authorization: `Bearer ${tokenB}`
  });
  assert.equal(bobMoodRes.status, 200);
  const bobMood = await bobMoodRes.json();
  assert.equal(bobMood, null, "User B must not see User A's logged mood");
});

test('SECURITY: NoSQL injection payloads are neutralized', async () => {
  // Payload attempting MongoDB query operator injection
  const injectionRes = await post('/api/auth/login', {
    email: { $gt: '' },
    password: { $gt: '' }
  });

  // Must reject without 500 error or authentication bypass
  assert.ok(injectionRes.status === 400 || injectionRes.status === 401);
  const data = await injectionRes.json();
  assert.ok(data.error);
});

test('SECURITY: Email templates sanitize user input against HTML injection (XSS)', () => {
  const maliciousName = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';

  // Verification email
  const verifyEmail = createVerificationEmail({
    name: maliciousName,
    verificationUrl: 'https://savastro.com/verify?token=abc'
  });
  assert.ok(!verifyEmail.html.includes('<script>'), 'Raw <script> tag must not appear in HTML');
  assert.ok(verifyEmail.html.includes('&lt;script&gt;'), 'HTML characters must be escaped');

  // Welcome email
  const welcomeEmail = createWelcomeEmail({
    name: maliciousName,
    dashboardUrl: 'https://savastro.com'
  });
  assert.ok(!welcomeEmail.html.includes('<script>'));
  assert.ok(welcomeEmail.html.includes('&lt;script&gt;'));

  // Password reset email
  const resetEmail = createPasswordResetEmail({
    name: maliciousName,
    resetUrl: 'https://savastro.com/reset?token=abc',
    expiresInMinutes: 60
  });
  assert.ok(!resetEmail.html.includes('<script>'));
  assert.ok(resetEmail.html.includes('&lt;script&gt;'));

  // Login notification email
  const loginAlert = createLoginNotificationEmail({
    name: maliciousName,
    date: new Date(),
    ip: '<b>spoofed-ip</b>',
    userAgent: '<iframe src=evil.com></iframe>',
    accountUrl: 'https://savastro.com'
  });
  assert.ok(!loginAlert.html.includes('<iframe'));
  assert.ok(!loginAlert.html.includes('<b>spoofed-ip</b>'));
  assert.ok(loginAlert.html.includes('&lt;b&gt;spoofed-ip&lt;/b&gt;'));
});

test('SECURITY: Helmet HTTP security headers are set and X-Powered-By is hidden', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 200);

  // X-Powered-By must be disabled
  assert.equal(res.headers.get('x-powered-by'), null);

  // Helmet headers
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-dns-prefetch-control'), 'off');
});
