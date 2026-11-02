import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is missing in production environment.');
    }
    return 'savastro-development-jwt-fallback-secret-key-32chars';
  }
  return secret;
};

/**
 * Generate a cryptographically secure random token (hex string).
 */
export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a plain token using SHA-256 for secure database storage.
 */
export const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

/**
 * Generates a signed JWT token for an authenticated user.
 */
export const generateJwt = (userId, options = {}) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: String(userId) }, secret, { expiresIn, ...options });
};

/**
 * Verifies a JWT token.
 */
export const verifyJwt = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

export default { generateRandomToken, hashToken, generateJwt, verifyJwt };
