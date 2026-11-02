import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/server.js';
import { createVerificationEmail } from '../src/templates/verificationEmail.js';
import { createWelcomeEmail } from '../src/templates/welcomeEmail.js';
import { createLoginNotificationEmail } from '../src/templates/loginNotificationEmail.js';
import { createPasswordResetEmail } from '../src/templates/passwordResetEmail.js';
import emailService from '../src/services/emailService.js';
import { generateJwt, verifyJwt, hashToken } from '../src/utils/tokens.js';

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

test('GET /api/health returns 200 OK and service status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.ok(data.timestamp);
});

test('Token utilities generate and verify JWTs correctly', () => {
  const userId = '64b1f2e3c9d8a7b6c5d4e3f2';
  const token = generateJwt(userId);
  assert.ok(token);

  const decoded = verifyJwt(token);
  assert.equal(decoded.id, userId);

  const hashed = hashToken('sample_token_123');
  assert.equal(typeof hashed, 'string');
  assert.equal(hashed.length, 64);
});

test('Email templates render valid HTML, text, and Savastro branding', () => {
  // Verification template
  const verify = createVerificationEmail({
    name: 'Sheetal',
    verificationUrl: 'https://savastro.com/verify?token=123'
  });
  assert.ok(verify.subject.includes('Verify Your Email'));
  assert.ok(verify.html.includes('Savastro'));
  assert.ok(verify.html.includes('https://savastro.com/verify?token=123'));
  assert.ok(verify.text.includes('Sheetal'));

  // Welcome template
  const welcome = createWelcomeEmail({
    name: 'Sheetal',
    dashboardUrl: 'https://savastro.com'
  });
  assert.ok(welcome.subject.includes('Welcome to Savastro'));
  assert.ok(welcome.html.includes('Mood Check-ins'));

  // Login notification template
  const loginAlert = createLoginNotificationEmail({
    name: 'Sheetal',
    date: new Date(),
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Chrome',
    accountUrl: 'https://savastro.com'
  });
  assert.ok(loginAlert.subject.includes('New Login to Your Savastro Account'));
  assert.ok(loginAlert.html.includes('192.168.1.1'));

  // Password reset template
  const reset = createPasswordResetEmail({
    name: 'Sheetal',
    resetUrl: 'https://savastro.com/reset?token=xyz',
    expiresInMinutes: 60
  });
  assert.ok(reset.subject.includes('Reset Your Savastro Password'));
  assert.ok(reset.html.includes('https://savastro.com/reset?token=xyz'));
});

test('emailService handles unconfigured SMTP safely without crashing', async () => {
  const result = await emailService.sendMail({
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<p>Hello</p>',
    text: 'Hello'
  });
  assert.equal(result.success, true);
  assert.equal(result.simulated, true);
});

test('POST /api/auth/register rejects invalid inputs', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'not-an-email', password: '123' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
});

test('POST /api/auth/register creates user account with password hashing', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sheetal',
      email: 'sheetal@example.com',
      password: 'StrongPassword123!'
    })
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.token);
  assert.equal(data.user.email, 'sheetal@example.com');
  assert.equal(data.user.name, 'Sheetal');
});

test('POST /api/auth/register prevents duplicate email registration', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate',
      email: 'sheetal@example.com',
      password: 'StrongPassword123!'
    })
  });
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.match(data.error, /already exists/i);
});

test('POST /api/auth/login validates credentials correctly', async () => {
  // Invalid password
  const failRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetal@example.com',
      password: 'WrongPassword'
    })
  });
  assert.equal(failRes.status, 401);

  // Correct credentials
  const successRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetal@example.com',
      password: 'StrongPassword123!'
    })
  });
  assert.equal(successRes.status, 200);
  const data = await successRes.json();
  assert.ok(data.token);
  assert.equal(data.user.email, 'sheetal@example.com');
});

test('Protected routes reject requests without token and accept valid token', async () => {
  // Reject without token
  const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(unauthRes.status, 401);

  // Obtain token
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetal@example.com',
      password: 'StrongPassword123!'
    })
  });
  const { token } = await loginRes.json();

  // Accept with Bearer token
  const authRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(authRes.status, 200);
  const profile = await authRes.json();
  assert.equal(profile.user.email, 'sheetal@example.com');
});

test('Mood endpoints allow tracking and reporting', async () => {
  // Log in
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetal@example.com',
      password: 'StrongPassword123!'
    })
  });
  const { token } = await loginRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Submit mood
  const submitRes = await fetch(`${baseUrl}/api/mood`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ mood: 'good' })
  });
  assert.equal(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.equal(submitData.ok, true);

  // Check today mood
  const todayRes = await fetch(`${baseUrl}/api/mood/today`, {
    headers: authHeaders
  });
  assert.equal(todayRes.status, 200);
  const todayData = await todayRes.json();
  assert.equal(todayData.mood, 'good');

  // Check report
  const reportRes = await fetch(`${baseUrl}/api/mood/report?range=week`, {
    headers: authHeaders
  });
  assert.equal(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.ok(Array.isArray(reportData.series));
  assert.equal(reportData.total, 7);
});

test('Activities endpoints allow task creation and progress', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetal@example.com',
      password: 'StrongPassword123!'
    })
  });
  const { token } = await loginRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Create task
  const createRes = await fetch(`${baseUrl}/api/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Meditation', target: 5, seconds: 30 })
  });
  assert.equal(createRes.status, 201);
  const act = await createRes.json();
  assert.equal(act.name, 'Meditation');

  // Update progress
  const progRes = await fetch(`${baseUrl}/api/activities/${act._id || act.id}/progress`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ count: 5 })
  });
  assert.equal(progRes.status, 200);

  // Complete
  const doneRes = await fetch(`${baseUrl}/api/activities/${act._id || act.id}/complete`, {
    method: 'POST',
    headers: authHeaders
  });
  assert.equal(doneRes.status, 200);
  const doneData = await doneRes.json();
  assert.equal(doneData.status, 'done');
});

test('GET /api/pros returns list of guides with default values', async () => {
  const res = await fetch(`${baseUrl}/api/pros`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 3);
  assert.equal(data[0].name, 'Acharya Devendra Shastri');
});

test('Unknown API routes return 404 JSON, not HTML', async () => {
  const res = await fetch(`${baseUrl}/api/unknown-endpoint-xyz`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
  const data = await res.json();
  assert.ok(data.error);
});
