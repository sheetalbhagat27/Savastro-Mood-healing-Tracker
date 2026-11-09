export const notFound = (req, res) => res.status(404).json({ error: 'Route not found' })
export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500
  let message = err.message || 'Server error'
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', ') }
  else if (err.code === 11000) { status = 409; message = 'This record already exists' }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid id' }
  if (status === 500) console.error(err)
  res.status(status).json({ error: status === 500 && process.env.NODE_ENV === 'production' ? 'Server error' : message })
}
