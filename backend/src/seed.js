import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'
import Guide from './models/Guide.js'
import connectDB from './config/db.js'

await connectDB()
const people = [
  { name: 'Admin', email: 'admin@sovastro.com', password: 'Admin@12345', role: 'admin' },
  { name: 'Anjana Sharma', email: 'astrologer@sovastro.com', password: 'Astro@12345', role: 'astrologer' },
  { name: 'Demo User', email: 'user@sovastro.com', password: 'User@12345', role: 'user' }
]
for (const p of people) if (!(await User.exists({ email: p.email }))) await User.create(p)
if (!(await Guide.countDocuments())) {
  await Guide.insertMany([
    { name: 'Anjana Sharma', type: 'Career & Life Guidance', exp: 8, rating: 4.8, price: 499, languages: 'Hindi · English', photo: '/assets/anjana.png' },
    { name: 'Rohit Mehta', type: 'Vedic Astrology', exp: 10, rating: 4.9, price: 699, languages: 'Hindi · English', photo: '/assets/rohit.png' },
    { name: 'Pooja Verma', type: 'Life & Career Coach', exp: 6, rating: 4.7, price: 399, languages: 'English · Hindi', photo: '/assets/pooja.png' }
  ])
}
console.log('Seed complete.\n admin@sovastro.com / Admin@12345\n astrologer@sovastro.com / Astro@12345\n user@sovastro.com / User@12345\nChange these passwords before going live.')
await mongoose.disconnect()
