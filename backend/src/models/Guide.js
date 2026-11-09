import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  exp: { type: Number, default: 1 },
  rating: { type: Number, default: 4.5 },
  price: { type: Number, default: 0 },
  languages: { type: String, default: 'Hindi · English' },
  photo: { type: String, default: '' },
  online: { type: Boolean, default: true }
}, { timestamps: true })
export default mongoose.models.Guide || mongoose.model('Guide', schema)
