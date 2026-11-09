import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  password: { type: String, required: true, minlength: 8, select: false },
  phone: { type: String, default: '', maxlength: 20 },
  role: { type: String, enum: ['user', 'astrologer', 'admin'], default: 'user', index: true },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true })
schema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12)
  next()
})
schema.methods.matches = function (p) { return bcrypt.compare(p, this.password) }
export default mongoose.models.User || mongoose.model('User', schema)
