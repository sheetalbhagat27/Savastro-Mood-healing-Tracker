import Task from '../models/Task.js'
import { httpError, wrap, str } from '../utils/http.js'
export const list = wrap(async (req, res) => res.json(await Task.find({ user: req.user._id }).sort('-createdAt').limit(100)))
export const create = wrap(async (req, res) => {
  const name = str(req.body.name, 100), target = Math.floor(Number(req.body.target))
  if (name.length < 2) throw httpError(400, 'Please enter a task name')
  if (!(target >= 1 && target <= 1008)) throw httpError(400, 'Target must be between 1 and 1008')
  res.status(201).json(await Task.create({ user: req.user._id, name, target }))
})
const mine = async req => {
  const t = await Task.findOne({ _id: req.params.id, user: req.user._id })
  if (!t) throw httpError(404, 'Task not found')
  return t
}
export const progress = wrap(async (req, res) => {
  const t = await mine(req)
  if (t.status === 'done') throw httpError(409, 'Task already completed')
  const c = Math.floor(Number(req.body.count))
  if (!(c >= 0)) throw httpError(400, 'Invalid count')
  t.count = Math.min(t.target, c)
  res.json(await t.save())
})
export const complete = wrap(async (req, res) => {
  const t = await mine(req)
  if (t.count < t.target) throw httpError(400, 'Not finished yet. Please reach the target count.')
  t.status = 'done'; t.completedAt = new Date()
  res.json(await t.save())
})
export const remove = wrap(async (req, res) => { await mine(req); await Task.deleteOne({ _id: req.params.id }); res.json({ ok: true }) })
