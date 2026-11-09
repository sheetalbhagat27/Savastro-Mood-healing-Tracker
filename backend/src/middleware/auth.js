import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { httpError, wrap } from '../utils/http.js'
export const protect = wrap(async (req, res, next) => {
  const token = req.cookies?.sv_token
  if (!token) throw httpError(401, 'Please log in to continue')
  let p
  try { p = jwt.verify(token, process.env.JWT_SECRET) } catch { throw httpError(401, 'Your session has expired. Please log in again') }
  const user = await User.findById(p.id)
  if (!user || user.tokenVersion !== p.v) throw httpError(401, 'Your session has expired. Please log in again')
  req.user = user
  next()
})
export const restrictTo = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(httpError(403, 'You do not have access to this'))
