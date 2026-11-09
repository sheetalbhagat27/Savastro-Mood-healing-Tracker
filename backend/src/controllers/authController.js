import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { httpError, wrap, str } from '../utils/http.js'

const prod = () => process.env.NODE_ENV === 'production'
const cookieOpts = () => ({ httpOnly: true, secure: prod(), sameSite: prod() ? (process.env.COOKIE_SAMESITE || 'none') : 'lax', path: '/api' })
const pub = u => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role })
const issue = (res, u) => {
  const t = jwt.sign({ id: u._id, v: u.tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
  res.cookie('sv_token', t, { ...cookieOpts(), maxAge: 7 * 864e5 })
}

export const register = wrap(async (req, res) => {
  const name = str(req.body.name, 80), email = str(req.body.email, 120).toLowerCase(), phone = str(req.body.phone, 20)
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (name.length < 2) throw httpError(400, 'Please enter your full name')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Please enter a valid email')
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters')
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists')
  const user = await User.create({ name, email, phone, password }) // role is ALWAYS "user"
  issue(res, user)
  res.status(201).json({ user: pub(user) })
})

export const login = wrap(async (req, res) => {
  const email = str(req.body.email, 120).toLowerCase()
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.matches(password))) throw httpError(401, 'Invalid email or password')
  issue(res, user)
  res.json({ user: pub(user) })
})

export const logout = wrap(async (req, res) => {
  req.user.tokenVersion += 1 // revokes every existing session token
  await req.user.save()
  res.clearCookie('sv_token', cookieOpts())
  res.json({ ok: true })
})

export const me = (req, res) => res.json({ user: pub(req.user) })
