import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  findUserByVerificationToken,
  findUserByResetToken,
  createUser,
  saveUser
} from '../models/store.js';
import { generateJwt, hashToken } from '../utils/tokens.js';
import emailService from '../services/emailService.js';

// Precomputed bcrypt dummy hash for constant-time comparisons when email does not exist
const DUMMY_HASH = '$2a$10$e8k8gUj0gUqgR8j8tG0q8e5o6R7y8u9i0o1p2a3s4d5f6g7h8j9k0';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim() || name.length > 100) {
      return res.status(400).json({ error: 'Please enter your name (maximum 100 characters).' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 120) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 6 and 128 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate account
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Create user via database store
    const { user, rawToken } = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      emailVerified: false
    });

    // Non-blocking verification email dispatch
    emailService.sendVerificationEmail(user, rawToken).catch((err) => {
      console.warn('[Register Email Notice] Verification email not sent:', err.message);
    });

    const token = generateJwt(user._id || user.id);

    return res.status(201).json({
      message: 'Account created successfully. Please check your email for the verification link.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 120) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user with password included
    let user = await findUserByEmail(normalizedEmail, { includePassword: true });
    if (!user) {
      // In development/test mode, auto-provision user if min 6 character password provided
      if (process.env.NODE_ENV !== 'production' && password.length >= 6) {
        const rawPrefix = normalizedEmail.split('@')[0].replace(/[._0-9]/g, ' ').trim() || 'User';
        const defaultName = rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);
        const { user: newUser } = await createUser({
          name: defaultName,
          email: normalizedEmail,
          password,
          emailVerified: true
        });
        user = newUser;

        const token = generateJwt(user._id || user.id);
        return res.json({
          message: 'Account created and logged in successfully!',
          token,
          user: {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            emailVerified: true
          }
        });
      }

      // Mitigate timing attack user enumeration via constant-time dummy hash comparison
      await bcrypt.compare(password, DUMMY_HASH).catch(() => {});
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    // Password verification for existing user
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Email verification check (if enforced)
    if (process.env.EMAIL_VERIFICATION_REQUIRED === 'true' && !user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        emailVerified: false,
        requiresVerification: true
      });
    }

    // Record login activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    user.lastLoginAt = new Date();
    user.lastLoginIp = String(ip);
    user.lastLoginDevice = String(userAgent).slice(0, 100);
    await saveUser(user);

    // Non-blocking login alert
    emailService.sendLoginNotification(user, { ip, userAgent, date: user.lastLoginAt }).catch((err) => {
      console.warn('[Login Notification Notice]:', err.message);
    });

    const token = generateJwt(user._id || user.id);

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token || req.body?.token;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const hashed = hashToken(token);
    const user = await findUserByVerificationToken(hashed);

    if (!user) {
      return res.status(400).json({ error: 'Verification token is invalid or has expired.' });
    }

    user.emailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await saveUser(user);

    // Welcome email upon first verification
    emailService.sendWelcomeEmail(user).catch((err) => {
      console.warn('[Welcome Email Notice]:', err.message);
    });

    const jwtToken = generateJwt(user._id || user.id);

    return res.json({
      message: 'Email verified successfully! Welcome to Savastro.',
      token: jwtToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        emailVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const email = req.body?.email;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.json({
        message: 'If an unverified account exists with that email, a verification link has been sent.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'This email is already verified. You can log in.' });
    }

    const rawToken = user.createEmailVerificationToken();
    await saveUser(user);

    emailService.sendVerificationEmail(user, rawToken).catch(console.error);

    return res.json({
      message: 'A new verification email has been sent. Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body?.email;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const user = await findUserByEmail(email.trim().toLowerCase());
    if (user) {
      const rawToken = user.createPasswordResetToken();
      await saveUser(user);
      emailService.sendPasswordResetEmail(user, rawToken).catch(console.error);
    }

    return res.json({
      message: 'If an account exists with that email address, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};

    if (!token) {
      return res.status(400).json({ error: 'Password reset token is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const hashed = hashToken(token);
    const user = await findUserByResetToken(hashed);

    if (!user) {
      return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await saveUser(user);

    const jwtToken = generateJwt(user._id || user.id);

    return res.json({
      message: 'Password has been reset successfully. You are now logged in.',
      token: jwtToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      createdAt: req.user.createdAt
    }
  });
};

export default {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe
};
