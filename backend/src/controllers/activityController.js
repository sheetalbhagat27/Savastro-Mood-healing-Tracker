import {
  findUserActivities,
  createActivity as storeCreateActivity,
  findActivityById,
  findDueNotification
} from '../models/store.js';

const REMIND_MS = 60 * 1000;

export const getActivities = async (req, res, next) => {
  try {
    const activities = await findUserActivities(req.user._id || req.user.id);
    return res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const { name, by, target, seconds } = req.body || {};
    const userId = req.user._id || req.user.id;

    const activity = await storeCreateActivity({
      userId,
      name: name || 'Om Namah Shivay',
      by: by || 'Acharya Devendra Shastri',
      target: +target || 5,
      seconds: +seconds || 20
    });

    return res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { count } = req.body || {};
    const userId = req.user._id || req.user.id;

    const activity = await findActivityById(id, userId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    activity.count = Math.min(activity.target, +count || 0);
    await activity.save();

    return res.json(activity);
  } catch (error) {
    next(error);
  }
};

export const completeActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const activity = await findActivityById(id, userId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.count < activity.target) {
      return res.status(400).json({ error: 'Not finished yet. Please reach target count.' });
    }

    activity.status = 'done';
    await activity.save();

    return res.json(activity);
  } catch (error) {
    next(error);
  }
};

export const postponeActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const activity = await findActivityById(id, userId);
    if (activity) {
      activity.last = new Date();
      await activity.save();
    }

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - REMIND_MS);
    const userId = req.user._id || req.user.id;

    const activity = await findDueNotification(userId, cutoff);
    if (activity) {
      activity.last = new Date();
      await activity.save();
    }

    return res.json(activity || null);
  } catch (error) {
    next(error);
  }
};

export default {
  getActivities,
  createActivity,
  updateProgress,
  completeActivity,
  postponeActivity,
  getNotification
};
