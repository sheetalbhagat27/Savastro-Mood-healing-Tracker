import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  note: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true })
export default mongoose.models.Booking || mongoose.model('Booking', schema)
