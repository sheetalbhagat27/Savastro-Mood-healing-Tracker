import Guide from '../models/Guide.js'
import Booking from '../models/Booking.js'
import { httpError, wrap, str, isDate, dayStr } from '../utils/http.js'
export const list = wrap(async (req, res) => res.json(await Guide.find().sort('-rating')))
export const book = wrap(async (req, res) => {
  const guide = await Guide.findById(req.params.id)
  if (!guide) throw httpError(404, 'Guide not found')
  const date = req.body.date, time = str(req.body.time, 5)
  if (!isDate(date) || date < dayStr()) throw httpError(400, 'Please choose a valid future date')
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw httpError(400, 'Please choose a valid time')
  if (await Booking.exists({ guide: guide._id, date, time, status: { $ne: 'cancelled' } })) throw httpError(409, 'That slot is already booked. Please pick another time')
  res.status(201).json(await Booking.create({ user: req.user._id, guide: guide._id, date, time, note: str(req.body.note, 500) }))
})
export const mine = wrap(async (req, res) => res.json(await Booking.find({ user: req.user._id }).populate('guide', 'name type price photo').sort('-createdAt').limit(50)))
export const cancel = wrap(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user._id })
  if (!b) throw httpError(404, 'Booking not found')
  b.status = 'cancelled'
  res.json(await b.save())
})
