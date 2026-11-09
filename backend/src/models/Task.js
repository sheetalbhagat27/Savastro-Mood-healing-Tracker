import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  target: { type: Number, min: 1, max: 1008, default: 11 },
  count: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  completedAt: Date
}, { timestamps: true })
export default mongoose.models.Task || mongoose.model('Task', schema)
