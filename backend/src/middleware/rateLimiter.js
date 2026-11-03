/**
 * In-memory sliding window rate limiter for brute-force and DoS protection.
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

    // Safely extract client IP address
    const forwarded = req.headers['x-forwarded-for'];
    let ip = '';
    if (forwarded && typeof forwarded === 'string') {
      ip = forwarded.split(',')[0].trim();
    } else {
      ip = req.ip || req.socket?.remoteAddress || 'unknown';
    }

    const now = Date.now();
    const record = store.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    store.set(ip, record);

    // Periodically prune stale entries to prevent memory growth
    if (store.size > 2000) {
      for (const [key, val] of store.entries()) {
        if (now > val.resetTime) store.delete(key);
      }
    }

    // Standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

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
  max: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again in 30 minutes.'
});

export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please slow down.'
});

export default { createRateLimiter, authLimiter, passwordResetLimiter, generalLimiter };
