// Origin guard (CSRF defence for cookie auth) + NoSQL-injection sanitizer
export const allowedOrigins = () =>
  [process.env.FRONTEND_URL, ...(process.env.EXTRA_ALLOWED_ORIGINS || '').split(',')].map(s => s && s.trim()).filter(Boolean)

export const originGuard = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (origin && !allowedOrigins().includes(origin)) return res.status(403).json({ error: 'Origin not allowed' })
  next()
}

const clean = v => {
  if (Array.isArray(v)) return v.map(clean)
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      if (k.startsWith('$') || k.includes('.')) delete v[k]
      else v[k] = clean(v[k])
    }
  }
  return v
}
export const sanitize = (req, res, next) => { clean(req.body); clean(req.params); next() }
