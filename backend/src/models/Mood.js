import mongoose from 'mongoose'
export const MOODS = {
  happy: ['😄', 'Happy', 5], good: ['🙂', 'Good', 4], okay: ['😐', 'Okay', 3], confused: ['😕', 'Confused', 3],
  notgood: ['🙁', 'Not very good', 2], low: ['😔', 'Low', 2], anxious: ['😰', 'Anxious', 1], stressed: ['😣', 'Stressed', 1]
}
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  mood: { type: String, required: true, enum: Object.keys(MOODS) },
  score: { type: Number, required: true, min: 1, max: 5 },
  at: { type: Date, default: Date.now }
}, { timestamps: true })
schema.index({ user: 1, date: 1 }, { unique: true })
export default mongoose.models.Mood || mongoose.model('Mood', schema)
