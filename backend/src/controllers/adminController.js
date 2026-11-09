import User from '../models/User.js'
import Lead from '../models/Lead.js'
import Mood from '../models/Mood.js'
import Remedy from '../models/Remedy.js'
import Booking from '../models/Booking.js'
import { httpError, wrap, dayStr } from '../utils/http.js'

export const stats = wrap(async (req, res) => {
  const [users, astrologers, moodsToday, remedies, leads, bookings] = await Promise.all([
    User.countDocuments({ role: 'user' }), User.countDocuments({ role: 'astrologer' }),
    Mood.countDocuments({ date: dayStr() }), Remedy.countDocuments({ active: true }),
    Lead.countDocuments({ handled: false }), Booking.countDocuments({ status: { $ne: 'cancelled' } })
  ])
  res.json({ users, astrologers, moodsToday, remedies, leads, bookings })
})
export const users = wrap(async (req, res) => res.json(await User.find().select('name email role createdAt').sort('-createdAt').limit(300)))
export const setRole = wrap(async (req, res) => {
  const role = req.body.role
  if (!['user', 'astrologer', 'admin'].includes(role)) throw httpError(400, 'Invalid role')
  if (String(req.params.id) === String(req.user._id)) throw httpError(400, 'You cannot change your own role')
  const u = await User.findById(req.params.id)
  if (!u) throw httpError(404, 'User not found')
  u.role = role; u.tokenVersion += 1 // force re-login with the new role
  await u.save()
  res.json({ id: u._id, role: u.role })
})
export const leads = wrap(async (req, res) => res.json(await Lead.find().sort('-createdAt').limit(200)))
export const handleLead = wrap(async (req, res) => {
  const l = await Lead.findByIdAndUpdate(req.params.id, { handled: !!req.body.handled }, { new: true })
  if (!l) throw httpError(404, 'Lead not found')
  res.json(l)
})
export const bookings = wrap(async (req, res) =>
  res.json(await Booking.find().populate('user', 'name email').populate('guide', 'name').sort('-createdAt').limit(200)))
export const setBooking = wrap(async (req, res) => {
  if (!['pending', 'confirmed', 'cancelled'].includes(req.body.status)) throw httpError(400, 'Invalid status')
  const b = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
  if (!b) throw httpError(404, 'Booking not found')
  res.json(b)
})
