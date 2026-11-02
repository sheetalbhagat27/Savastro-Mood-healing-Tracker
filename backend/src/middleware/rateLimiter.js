/**
 * In-memory sliding window rate limiter for brute-force protection.
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many requests from this IP. Please try again later.'
}) => {
  const store = new Map();

  return (req, res, next) => {
    // Skip rate limiting in test environments
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = store.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    store.set(ip, record);

    // Periodically prune stale entries
    if (store.size > 1000) {
      for (const [key, val] of store.entries()) {
        if (now > val.resetTime) store.delete(key);
      }
    }

    if (record.count > max) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', waitSeconds);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: waitSeconds
      });
    }

    next();
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again in 30 minutes.'
});

export default { createRateLimiter, authLimiter, passwordResetLimiter };
