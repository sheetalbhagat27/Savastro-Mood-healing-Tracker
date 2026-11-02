import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './User.js';
import Mood, { MOOD_DEFINITIONS } from './Mood.js';
import Activity from './Activity.js';
import Pro, { INITIAL_PROS } from './Pro.js';
import { generateRandomToken, hashToken } from '../utils/tokens.js';

// Development & Test in-memory storage fallback
const memUsers = new Map();
const memMoods = [];
const memActivities = [];

const isMongoActive = () => mongoose.connection.readyState === 1;

const checkProductionDb = () => {
  if (process.env.NODE_ENV === 'production' && !isMongoActive()) {
    const err = new Error('Database connection to MongoDB Atlas is currently unavailable.');
    err.status = 503;
    throw err;
  }
};

/**
 * USER STORE OPERATIONS
 */
export const findUserByEmail = async (email, { includePassword = false } = {}) => {
  checkProductionDb();
  const normalized = email.trim().toLowerCase();

  if (isMongoActive()) {
    const query = User.findOne({ email: normalized });
    if (includePassword) query.select('+password');
    return query;
  }

  // Memory fallback for dev/test
  const user = memUsers.get(normalized);
  if (!user) return null;
  return { ...user };
};

export const findUserById = async (id) => {
  checkProductionDb();
  if (isMongoActive()) {
    return User.findById(id);
  }

  for (const user of memUsers.values()) {
    if (String(user._id) === String(id) || String(user.id) === String(id)) {
      return { ...user };
    }
  }
  return null;
};

export const findUserByVerificationToken = async (hashedToken) => {
  checkProductionDb();
  if (isMongoActive()) {
    return User.findOne({
      verificationTokenHash: hashedToken,
      verificationTokenExpires: { $gt: new Date() }
    }).select('+verificationTokenHash +verificationTokenExpires');
  }

  for (const user of memUsers.values()) {
    if (
      user.verificationTokenHash === hashedToken &&
      user.verificationTokenExpires &&
      new Date(user.verificationTokenExpires) > new Date()
    ) {
      return { ...user };
    }
  }
  return null;
};

export const findUserByResetToken = async (hashedToken) => {
  checkProductionDb();
  if (isMongoActive()) {
    return User.findOne({
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+resetPasswordTokenHash +resetPasswordExpires');
  }

  for (const user of memUsers.values()) {
    if (
      user.resetPasswordTokenHash === hashedToken &&
      user.resetPasswordExpires &&
      new Date(user.resetPasswordExpires) > new Date()
    ) {
      return { ...user };
    }
  }
  return null;
};

export const createUser = async ({ name, email, password, emailVerified = false }) => {
  checkProductionDb();
  const normalized = email.trim().toLowerCase();

  if (isMongoActive()) {
    const user = new User({
      name: name.trim(),
      email: normalized,
      password,
      emailVerified
    });
    const rawToken = user.createEmailVerificationToken();
    await user.save();
    return { user, rawToken };
  }

  // In-memory creation
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const rawToken = generateRandomToken(32);
  const hashedToken = hashToken(rawToken);

  const user = {
    _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7),
    id: 'usr_' + Date.now(),
    name: name.trim(),
    email: normalized,
    password: hashedPassword,
    emailVerified,
    verificationTokenHash: hashedToken,
    verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    async comparePassword(candidate) {
      return bcrypt.compare(candidate, this.password);
    },
    createEmailVerificationToken() {
      const token = generateRandomToken(32);
      this.verificationTokenHash = hashToken(token);
      this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return token;
    },
    createPasswordResetToken() {
      const token = generateRandomToken(32);
      this.resetPasswordTokenHash = hashToken(token);
      this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      return token;
    },
    async save() {
      memUsers.set(this.email, this);
      return this;
    }
  };

  memUsers.set(normalized, user);
  return { user, rawToken };
};

export const saveUser = async (user) => {
  if (typeof user.save === 'function') {
    return user.save();
  }
  if (user.email) {
    memUsers.set(user.email, user);
  }
  return user;
};

/**
 * MOOD STORE OPERATIONS
 */
export const findTodayMood = async (userId, dateStr) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Mood.findOne({ user: userId, date: dateStr });
  }
  return memMoods.find((m) => String(m.user) === String(userId) && m.date === dateStr) || null;
};

export const saveMood = async ({ userId, dateStr, mood, score, at }) => {
  checkProductionDb();
  if (isMongoActive()) {
    const existing = await Mood.findOne({ user: userId, date: dateStr });
    if (existing) {
      existing.mood = mood;
      existing.score = score;
      existing.at = at || new Date();
      return existing.save();
    }
    return Mood.create({ user: userId, date: dateStr, mood, score, at });
  }

  let existing = memMoods.find((m) => String(m.user) === String(userId) && m.date === dateStr);
  if (existing) {
    existing.mood = mood;
    existing.score = score;
    existing.at = at || new Date();
    return existing;
  }
  const newMood = {
    _id: 'mood_' + Date.now() + Math.random().toString(36).substring(2, 6),
    user: String(userId),
    date: dateStr,
    mood,
    score,
    at: at || new Date()
  };
  memMoods.push(newMood);
  return newMood;
};

export const findUserMoods = async (userId) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Mood.find({ user: userId }).sort({ date: 1 });
  }
  return memMoods.filter((m) => String(m.user) === String(userId));
};

export const clearDemoMoods = async (userId, todayDate) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Mood.deleteMany({ user: userId, date: { $ne: todayDate } });
  }
  for (let i = memMoods.length - 1; i >= 0; i--) {
    if (String(memMoods[i].user) === String(userId) && memMoods[i].date !== todayDate) {
      memMoods.splice(i, 1);
    }
  }
};

export const insertManyMoods = async (entries) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Mood.insertMany(entries, { ordered: false });
  }
  memMoods.push(...entries);
};

/**
 * ACTIVITY STORE OPERATIONS
 */
export const findUserActivities = async (userId) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Activity.find({ user: userId }).sort({ createdAt: 1 });
  }
  return memActivities.filter((a) => String(a.user) === String(userId));
};

export const createActivity = async ({ userId, name, by, target, seconds }) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Activity.create({
      user: userId,
      name,
      by,
      target,
      seconds,
      count: 0,
      status: 'pending'
    });
  }

  const act = {
    _id: 'act_' + Date.now() + Math.random().toString(36).substring(2, 6),
    user: String(userId),
    name,
    by,
    target,
    seconds,
    count: 0,
    status: 'pending',
    last: null,
    createdAt: new Date(),
    async save() {
      const idx = memActivities.findIndex((a) => a._id === this._id);
      if (idx !== -1) memActivities[idx] = this;
      return this;
    }
  };
  memActivities.push(act);
  return act;
};

export const findActivityById = async (id, userId) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Activity.findOne({ _id: id, user: userId });
  }
  const act = memActivities.find(
    (a) => (String(a._id) === String(id) || String(a.id) === String(id)) && String(a.user) === String(userId)
  );
  if (!act) return null;
  if (typeof act.save !== 'function') {
    act.save = async function () {
      const idx = memActivities.findIndex((a) => a._id === this._id);
      if (idx !== -1) memActivities[idx] = this;
      return this;
    };
  }
  return act;
};

export const findDueNotification = async (userId, cutoffDate) => {
  checkProductionDb();
  if (isMongoActive()) {
    return Activity.findOne({
      user: userId,
      status: 'pending',
      $or: [{ last: null }, { last: { $lt: cutoffDate } }]
    });
  }

  const act = memActivities.find(
    (a) =>
      String(a.user) === String(userId) &&
      a.status === 'pending' &&
      (!a.last || new Date(a.last) < cutoffDate)
  );
  if (!act) return null;
  if (typeof act.save !== 'function') {
    act.save = async function () {
      const idx = memActivities.findIndex((a) => a._id === this._id);
      if (idx !== -1) memActivities[idx] = this;
      return this;
    };
  }
  return act;
};

/**
 * PROS STORE OPERATIONS
 */
export const findPros = async () => {
  checkProductionDb();
  if (isMongoActive()) {
    const list = await Pro.find().sort({ id: 1 });
    if (list && list.length > 0) return list;
  }
  return INITIAL_PROS;
};

export default {
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  findUserByResetToken,
  createUser,
  saveUser,
  findTodayMood,
  saveMood,
  findUserMoods,
  clearDemoMoods,
  insertManyMoods,
  findUserActivities,
  createActivity,
  findActivityById,
  findDueNotification,
  findPros
};
