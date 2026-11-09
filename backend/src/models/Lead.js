import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 80 },
  phone: { type: String, required: true, maxlength: 20 },
  dob: { type: String, required: true },
  tob: { type: String, default: '' },
  pob: { type: String, required: true, maxlength: 100 },
  topic: { type: String, default: 'Talk to an Astrologer', maxlength: 100 },
  expert: { type: String, default: '', maxlength: 80 },
  handled: { type: Boolean, default: false }
}, { timestamps: true })
export default mongoose.models.Lead || mongoose.model('Lead', schema)
