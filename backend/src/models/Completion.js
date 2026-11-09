import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  remedy: { type: mongoose.Schema.Types.ObjectId, ref: 'Remedy', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  slotKey: { type: String, required: true },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  status: { type: String, enum: ['started', 'completed'], default: 'started' },
  counterValue: { type: Number, default: 0 },
  durationSpent: { type: Number, default: 0 },
  proofType: { type: String, default: 'none' },
  proofNote: { type: String, default: '' },
  proofPhoto: { type: String, default: '' },
  reviewStatus: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'not_required', index: true },
  astrologerComment: { type: String, default: '' },
  reviewedAt: Date
}, { timestamps: true })
// one record per reminder slot per day -> blocks duplicate submissions
schema.index({ remedy: 1, user: 1, date: 1, slotKey: 1 }, { unique: true })
export default mongoose.models.Completion || mongoose.model('Completion', schema)
