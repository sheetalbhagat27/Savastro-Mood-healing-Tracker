import Remedy from '../models/Remedy.js'
import Completion from '../models/Completion.js'
import User from '../models/User.js'
import { httpError, wrap, str, isDate, dayStr } from '../utils/http.js'

const METHODS = ['timer', 'counter', 'photo', 'checkin']
const slotsOf = r => (r.reminderTimes?.length ? r.reminderTimes : ['daily'])
const isStaff = u => u.role === 'astrologer' || u.role === 'admin'
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export const clients = wrap(async (req, res) =>
  res.json(await User.find({ role: 'user' }).select('name email').sort('name').limit(500)))

export const create = wrap(async (req, res) => {
  const b = req.body
  const user = await User.findOne({ _id: str(b.userId, 40), role: 'user' }).catch(() => null)
  if (!user) throw httpError(400, 'Please choose a valid client')
  const title = str(b.title, 140), instructions = str(b.instructions, 2000), category = str(b.category, 60)
  if (title.length < 3 || instructions.length < 5 || !category) throw httpError(400, 'Title, category and instructions are required')
  if (!METHODS.includes(b.completionMethod)) throw httpError(400, 'Invalid completion method')
  if (!isDate(b.startDate) || !isDate(b.endDate) || b.endDate < b.startDate) throw httpError(400, 'Please choose a valid date range')
  const times = Array.isArray(b.reminderTimes) ? [...new Set(b.reminderTimes.map(t => str(t, 5)))].slice(0, 6) : []
  if (times.some(t => !HHMM.test(t))) throw httpError(400, 'Reminder times must be HH:mm')
  const dailyTarget = Math.floor(Number(b.dailyTarget)) || 1, durationSeconds = Math.floor(Number(b.durationSeconds)) || 0
  if (b.completionMethod === 'timer' && durationSeconds < 10) throw httpError(400, 'Timer remedies need a duration of at least 10 seconds')
  const r = await Remedy.create({ user: user._id, astrologer: req.user._id, title, instructions, category, completionMethod: b.completionMethod, dailyTarget, durationSeconds, reminderTimes: times, startDate: b.startDate, endDate: b.endDate })
  res.status(201).json(r)
})

export const list = wrap(async (req, res) => {
  const date = dayStr()
  if (isStaff(req.user)) {
    const filter = req.user.role === 'admin' ? { active: true } : { astrologer: req.user._id, active: true }
    const rows = await Remedy.find(filter).populate('user', 'name email').sort('-createdAt').limit(200).lean()
    for (const r of rows) r.completedCount = await Completion.countDocuments({ remedy: r._id, status: 'completed' })
    return res.json(rows)
  }
  const rows = await Remedy.find({ user: req.user._id, active: true }).populate('astrologer', 'name').sort('-createdAt').lean()
  const comps = await Completion.find({ user: req.user._id, date, remedy: { $in: rows.map(r => r._id) } }).select('-proofPhoto').lean()
  rows.forEach(r => {
    r.slots = slotsOf(r)
    r.scheduledToday = date >= r.startDate && date <= r.endDate
    r.today = comps.filter(c => String(c.remedy) === String(r._id))
  })
  res.json(rows)
})

export const start = wrap(async (req, res) => {
  const r = await Remedy.findOne({ _id: req.params.id, user: req.user._id, active: true })
  if (!r) throw httpError(404, 'Remedy not found')
  const date = dayStr()
  if (date < r.startDate || date > r.endDate) throw httpError(400, 'This remedy is not scheduled for today')
  const slotKey = str(req.body.slot, 10) || slotsOf(r)[0]
  if (!slotsOf(r).includes(slotKey)) throw httpError(400, 'Invalid reminder slot')
  const found = await Completion.findOne({ remedy: r._id, user: req.user._id, date, slotKey })
  if (found) {
    if (found.status === 'completed') throw httpError(409, 'This slot is already completed')
    return res.json(found)
  }
  res.status(201).json(await Completion.create({ remedy: r._id, user: req.user._id, date, slotKey, startedAt: new Date() }))
})

export const complete = wrap(async (req, res) => {
  const r = await Remedy.findOne({ _id: req.params.id, user: req.user._id, active: true })
  if (!r) throw httpError(404, 'Remedy not found')
  const slotKey = str(req.body.slot, 10) || slotsOf(r)[0]
  const c = await Completion.findOne({ remedy: r._id, user: req.user._id, date: dayStr(), slotKey })
  if (!c) throw httpError(400, 'Please start this remedy first')
  if (c.status === 'completed') throw httpError(409, 'This slot is already completed')
  const elapsed = (Date.now() - c.startedAt.getTime()) / 1000
  const m = r.completionMethod
  c.reviewStatus = 'not_required'
  if (m === 'timer' && elapsed < r.durationSeconds - 1) throw httpError(400, `Please complete the full ${r.durationSeconds}s timer`)
  if (m === 'counter') {
    const n = Math.floor(Number(req.body.counterValue))
    if (!(n >= r.dailyTarget)) throw httpError(400, `Please reach the target of ${r.dailyTarget}`)
    c.counterValue = Math.min(n, 100000)
  }
  if (m === 'photo') {
    const p = req.body.photo
    if (typeof p !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/.test(p) || p.length > 1_500_000) throw httpError(400, 'Please upload a photo (JPG/PNG/WebP, under 1 MB)')
    c.proofPhoto = p; c.reviewStatus = 'pending'
  }
  c.proofType = m
  c.proofNote = str(req.body.note, 500)
  c.durationSpent = Math.round(elapsed)
  c.status = 'completed'; c.completedAt = new Date()
  await c.save()
  res.json({ ...c.toObject(), proofPhoto: undefined })
})

export const progress = wrap(async (req, res) => {
  const r = await Remedy.findById(req.params.id)
  if (!r) throw httpError(404, 'Remedy not found')
  const owner = String(r.user) === String(req.user._id)
  const staff = req.user.role === 'admin' || String(r.astrologer) === String(req.user._id)
  if (!owner && !staff) throw httpError(403, 'You do not have access to this')
  res.json(await Completion.find({ remedy: r._id }).select('-proofPhoto').sort('-date').limit(120))
})

export const pendingReviews = wrap(async (req, res) => {
  const mine = await Remedy.find(req.user.role === 'admin' ? {} : { astrologer: req.user._id }).select('_id')
  res.json(await Completion.find({ remedy: { $in: mine.map(m => m._id) }, reviewStatus: 'pending' })
    .populate('remedy', 'title').populate('user', 'name').sort('createdAt').limit(50))
})

export const review = wrap(async (req, res) => {
  const c = await Completion.findById(req.params.id).populate('remedy')
  if (!c) throw httpError(404, 'Submission not found')
  if (req.user.role !== 'admin' && String(c.remedy.astrologer) !== String(req.user._id)) throw httpError(403, 'You do not have access to this')
  if (!['approved', 'rejected'].includes(req.body.status)) throw httpError(400, 'Invalid status')
  c.reviewStatus = req.body.status
  c.astrologerComment = str(req.body.comment, 300)
  c.reviewedAt = new Date()
  await c.save()
  res.json({ ok: true })
})

export const remove = wrap(async (req, res) => {
  const r = await Remedy.findById(req.params.id)
  if (!r) throw httpError(404, 'Remedy not found')
  if (req.user.role !== 'admin' && String(r.astrologer) !== String(req.user._id)) throw httpError(403, 'You do not have access to this')
  r.active = false
  await r.save()
  res.json({ ok: true })
})
