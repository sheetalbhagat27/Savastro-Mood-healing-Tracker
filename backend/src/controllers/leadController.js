import Lead from '../models/Lead.js'
import { httpError, wrap, str, isDate } from '../utils/http.js'
export const create = wrap(async (req, res) => {
  const b = req.body
  const phone = str(b.phone, 20).replace(/[\s+-]/g, '').replace(/^91/, '')
  const lead = { name: str(b.name, 80), phone, dob: b.dob, tob: str(b.tob, 5), pob: str(b.pob, 100), topic: str(b.topic, 100) || 'Talk to an Astrologer', expert: str(b.expert, 80) }
  if (lead.name.length < 2) throw httpError(400, 'Enter your full name')
  if (!/^[6-9]\d{9}$/.test(phone)) throw httpError(400, 'Enter a valid 10-digit mobile number')
  if (!isDate(lead.dob)) throw httpError(400, 'Select your date of birth')
  if (lead.pob.length < 2) throw httpError(400, 'Enter your place of birth')
  await Lead.create(lead)
  res.status(201).json({ ok: true })
})
