import { MOOD_DEFINITIONS } from '../models/Mood.js';
import {
  findTodayMood,
  saveMood,
  findUserMoods,
  clearDemoMoods,
  insertManyMoods
} from '../models/store.js';

const day = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = () => day(new Date());
const EDIT_MS = 2 * 3600 * 1000;

const avg = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);

export const getTodayMood = async (req, res, next) => {
  try {
    const todayDate = today();
    const entry = await findTodayMood(req.user._id || req.user.id, todayDate);
    return res.json(entry || null);
  } catch (error) {
    next(error);
  }
};

export const submitMood = async (req, res, next) => {
  try {
    const { mood } = req.body || {};
    if (!mood || !MOOD_DEFINITIONS[mood]) {
      return res.status(400).json({ error: 'Please select how you feel' });
    }

    const todayDate = today();
    const now = new Date();
    const userId = req.user._id || req.user.id;
    const existing = await findTodayMood(userId, todayDate);

    if (existing) {
      if (now - new Date(existing.at) > EDIT_MS) {
        return res.status(403).json({ error: "Today's mood can no longer be changed" });
      }
    }

    await saveMood({
      userId,
      dateStr: todayDate,
      mood,
      score: MOOD_DEFINITIONS[mood][2],
      at: now
    });

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const range = req.query.range === 'month' ? 'month' : 'week';
    const now = new Date();
    const n = range === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const userId = req.user._id || req.user.id;

    // Fetch user moods from database
    const all = await findUserMoods(userId);

    const series = [];
    const rows = [];

    for (let i = 0; i < n; i++) {
      const d =
        range === 'week'
          ? new Date(now.getTime() - (6 - i) * 86400000)
          : new Date(now.getFullYear(), now.getMonth(), i + 1);

      const dateStr = day(d);
      const e = all.find((x) => x.date === dateStr);
      const label = range === 'week' ? d.toLocaleDateString('en', { weekday: 'short' }) : String(i + 1);

      if (e) {
        rows.push({
          mood: e.mood,
          score: e.score,
          date: e.date,
          label
        });
      }

      series.push({
        label,
        score: e ? e.score : null,
        emoji: e && MOOD_DEFINITIONS[e.mood] ? MOOD_DEFINITIONS[e.mood][0] : null
      });
    }

    const sc = rows.map((x) => x.score);
    const dist = {};
    rows.forEach((x) => {
      dist[x.mood] = (dist[x.mood] || 0) + 1;
    });

    const good = sc.filter((s) => s >= 4).length;
    const tough = sc.filter((s) => s <= 2).length;
    const h = Math.floor(sc.length / 2);
    const diff = sc.length > 3 ? avg(sc.slice(h)) - avg(sc.slice(0, h)) : 0;

    let swings = 0;
    for (let i = 1; i < sc.length; i++) {
      if (Math.abs(sc[i] - sc[i - 1]) >= 2) swings++;
    }

    let run = 0;
    let maxRun = 0;
    sc.forEach((s) => {
      run = s <= 2 ? run + 1 : 0;
      maxRun = Math.max(maxRun, run);
    });

    const trend =
      swings >= Math.max(3, sc.length * 0.3)
        ? 'Up and down'
        : diff > 0.4
        ? 'Getting better'
        : diff < -0.4
        ? 'Getting lower'
        : 'Steady';

    let cat = 'positive';
    let msg = 'A good stretch. Keep up what is working for you.';

    if (sc.length && (tough / sc.length >= 0.4 || maxRun >= 3)) {
      cat = 'low';
      msg = 'Some days were hard. Talking to someone you trust, or a professional, can help.';
    } else if (trend === 'Up and down') {
      cat = 'fluctuating';
      msg = 'Your mood moved a lot. A little rest and reflection may help.';
    }

    if (!sc.length) {
      msg = 'No moods yet for this period.';
    }

    const best = rows.length ? rows.reduce((a, b) => (b.score > a.score ? b : a)) : null;
    const low = rows.length ? rows.reduce((a, b) => (b.score < a.score ? b : a)) : null;

    return res.json({
      series,
      avg: avg(sc),
      tracked: sc.length,
      total: n,
      missed: n - sc.length,
      good,
      tough,
      trend,
      msg,
      cat,
      dist,
      best: best && MOOD_DEFINITIONS[best.mood] ? { label: best.label, emoji: MOOD_DEFINITIONS[best.mood][0] } : null,
      low: low && MOOD_DEFINITIONS[low.mood] ? { label: low.label, emoji: MOOD_DEFINITIONS[low.mood][0] } : null
    });
  } catch (error) {
    next(error);
  }
};

export const populateDemo = async (req, res, next) => {
  try {
    const todayDate = today();
    const userId = req.user._id || req.user.id;
    const sc = [3, 2, 2, 1, 2, 3, 4, 3, 2, 1, 2, 4, 4, 5, 4, 3, 2, 2, 3, 4, 5, 4, 3, 4, 5, 4];
    const keys = { 5: 'happy', 4: 'good', 3: 'okay', 2: 'low', 1: 'stressed' };

    // Clear previous demo records for this user (except today's entry)
    await clearDemoMoods(userId, todayDate);

    const newEntries = [];
    sc.forEach((s, i) => {
      if (i % 9 === 4) return;
      const d = new Date(Date.now() - (sc.length - i) * 86400000);
      newEntries.push({
        user: userId,
        date: day(d),
        mood: keys[s],
        score: s,
        at: d
      });
    });

    if (newEntries.length > 0) {
      await insertManyMoods(newEntries);
    }

    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export default {
  getTodayMood,
  submitMood,
  getReport,
  populateDemo
};
