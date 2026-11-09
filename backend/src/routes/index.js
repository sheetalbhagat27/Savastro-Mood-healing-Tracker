import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { protect, restrictTo } from '../middleware/auth.js'
import * as auth from '../controllers/authController.js'
import * as mood from '../controllers/moodController.js'
import * as task from '../controllers/taskController.js'
import * as guide from '../controllers/guideController.js'
import * as remedy from '../controllers/remedyController.js'
import * as lead from '../controllers/leadController.js'
import * as admin from '../controllers/adminController.js'

const r = Router()
const limit = (n, msg) => rateLimit({ windowMs: 15 * 60 * 1000, limit: n, standardHeaders: true, legacyHeaders: false, message: { error: msg } })
const authLimit = limit(20, 'Too many attempts. Please try again in 15 minutes')
const staff = restrictTo('astrologer', 'admin')

// public
r.post('/auth/register', authLimit, auth.register)
r.post('/auth/login', authLimit, auth.login)
r.post('/leads', limit(15, 'Too many requests. Please try again later'), lead.create)
r.get('/guides', guide.list)

// authenticated
r.post('/auth/logout', protect, auth.logout)
r.get('/auth/me', protect, auth.me)

r.get('/moods/today', protect, mood.today)
r.post('/moods', protect, mood.submit)
r.get('/moods/report', protect, mood.report)

r.get('/tasks', protect, task.list)
r.post('/tasks', protect, task.create)
r.patch('/tasks/:id/progress', protect, task.progress)
r.post('/tasks/:id/complete', protect, task.complete)
r.delete('/tasks/:id', protect, task.remove)

r.get('/bookings/mine', protect, guide.mine)
r.post('/guides/:id/book', protect, guide.book)
r.delete('/bookings/:id', protect, guide.cancel)

r.get('/remedies', protect, remedy.list)
r.post('/remedies', protect, staff, remedy.create)
r.get('/remedies/clients', protect, staff, remedy.clients)
r.get('/remedies/reviews/pending', protect, staff, remedy.pendingReviews)
r.patch('/remedies/completions/:id/review', protect, staff, remedy.review)
r.post('/remedies/:id/start', protect, restrictTo('user'), remedy.start)
r.post('/remedies/:id/complete', protect, restrictTo('user'), remedy.complete)
r.get('/remedies/:id/progress', protect, remedy.progress)
r.delete('/remedies/:id', protect, staff, remedy.remove)

r.use('/admin', protect, restrictTo('admin'))
r.get('/admin/stats', admin.stats)
r.get('/admin/users', admin.users)
r.patch('/admin/users/:id/role', admin.setRole)
r.get('/admin/leads', admin.leads)
r.patch('/admin/leads/:id', admin.handleLead)
r.get('/admin/bookings', admin.bookings)
r.patch('/admin/bookings/:id', admin.setBooking)

export default r
