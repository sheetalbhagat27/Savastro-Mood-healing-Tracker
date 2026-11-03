/**
 * Centralized error handling middleware.
 * Sanitizes errors, formats responses consistently, and prevents stack trace leakage.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Handle CORS rejection
  if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    message = 'Access forbidden: Origin not permitted.';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists.`;
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id: ${err.value}`;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON request body.';
  }

  // Sanitize 500 errors in production to prevent leaking internal stack/paths
  if (statusCode >= 500) {
    console.error(`[Server Error 500] ${req.method} ${req.originalUrl}:`, err);
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected server error occurred. Please try again later.';
    }
  }

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

export default errorHandler;
