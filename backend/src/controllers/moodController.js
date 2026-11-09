import Mood, { MOODS } from '../models/Mood.js'
import { httpError, wrap, dayStr } from '../utils/http.js'
const EDIT_MS = 2 * 3600 * 1000

export const today = wrap(async (req, res) => {
  res.json(await Mood.findOne({ user: req.user._id, date: dayStr() }))
})

export const submit = wrap(async (req, res) => {
  const mood = req.body.mood
  if (typeof mood !== 'string' || !MOODS[mood]) throw httpError(400, 'Please select how you feel')
  const date = dayStr()
  const existing = await Mood.findOne({ user: req.user._id, date })
  if (existing && Date.now() - existing.at > EDIT_MS) throw httpError(403, "Today's mood can no longer be changed")
  const doc = await Mood.findOneAndUpdate({ user: req.user._id, date }, { mood, score: MOODS[mood][2], at: existing ? existing.at : new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true })
  res.json(doc)
})

export const report = wrap(async (req, res) => {
  const range = req.query.range === 'month' ? 'month' : 'week'
  const n = range === 'month' ? 30 : 7
  const dates = Array.from({ length: n }, (_, i) => dayStr(new Date(Date.now() - (n - 1 - i) * 864e5)))
  const rows = await Mood.find({ user: req.user._id, date: { $in: dates } }).lean()
  const map = Object.fromEntries(rows.map(r => [r.date, r]))
  const series = dates.map(d => ({ date: d, mood: map[d]?.mood || null, score: map[d]?.score || null }))
  const scores = rows.map(r => r.score)
  const average = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
  let streak = 0
  for (let i = n - 1; i >= 0; i--) { if (series[i].mood) streak++; else if (i === n - 1) continue; else break }
  const distribution = {}
  rows.forEach(r => { distribution[r.mood] = (distribution[r.mood] || 0) + 1 })
  res.json({ range, series, average, logged: rows.length, days: n, streak, distribution })
})
