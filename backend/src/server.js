import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import connectDB from './config/db.js'
import routes from './routes/index.js'
import { originGuard, allowedOrigins, sanitize } from './middleware/security.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set in .env and be at least 32 characters'); process.exit(1)
}
const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: (o, cb) => cb(null, !o || allowedOrigins().includes(o)), credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use(sanitize)
app.use(originGuard)
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false }))
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))
app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 5000
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch(e => { console.error('Startup failed:', e.message); process.exit(1) })

