import { findUserById, findUserByEmail } from '../models/store.js';
import { verifyJwt } from '../utils/tokens.js';

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header,
 * loads the authenticated user from the database, and attaches to req.user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      // Legacy header fallback: x-user email
      const legacyEmail = req.headers['x-user'];
      if (legacyEmail && typeof legacyEmail === 'string' && legacyEmail.includes('@')) {
        const user = await findUserByEmail(legacyEmail.toLowerCase().trim());
        if (user) {
          req.user = user;
          return next();
        }
      }

      return res.status(401).json({
        error: 'Authentication required. Please log in to continue.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Your session has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        error: 'Invalid authentication token. Please log in again.',
        code: 'TOKEN_INVALID'
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Malformed token payload.' });
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return res.status(500).json({ error: 'Authentication service encountered an unexpected error.' });
  }
};

export default requireAuth;
