/**
 * NoSQL Injection and Parameter Pollution Sanitizer.
 * Recursively sanitizes request objects by removing keys starting with '$' or containing '.'.
 */
export const sanitizeValue = (val) => {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    // Trim string and remove null bytes
    return val.replace(/\0/g, '');
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }

  if (typeof val === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(val)) {
      // Prohibit MongoDB operator keys (e.g. $gt, $ne, $where) and dotted paths
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = sanitizeValue(value);
    }
    return clean;
  }

  return val;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params.
 */
export const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

export default mongoSanitize;
