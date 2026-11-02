import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateRandomToken, hashToken } from '../utils/tokens.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/,
        'Please provide a valid email address'
      ],
      index: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationTokenHash: {
      type: String,
      select: false
    },
    verificationTokenExpires: {
      type: Date,
      select: false
    },
    resetPasswordTokenHash: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
    lastLoginAt: {
      type: Date
    },
    lastLoginIp: {
      type: String
    },
    lastLoginDevice: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Create email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = generateRandomToken(32);
  this.verificationTokenHash = hashToken(rawToken);
  // Valid for 24 hours
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return rawToken;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = generateRandomToken(32);
  this.resetPasswordTokenHash = hashToken(rawToken);
  // Valid for 1 hour
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  return rawToken;
};

export const User = mongoose.model('User', userSchema);
export default User;
