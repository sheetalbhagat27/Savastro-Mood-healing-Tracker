import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  instructions: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, maxlength: 60 },
  completionMethod: { type: String, enum: ['timer', 'counter', 'photo', 'checkin'], required: true },
  dailyTarget: { type: Number, min: 1, max: 1008, default: 1 },
  durationSeconds: { type: Number, min: 0, max: 7200, default: 0 },
  reminderTimes: { type: [String], default: [] },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true })
export default mongoose.models.Remedy || mongoose.model('Remedy', schema)
