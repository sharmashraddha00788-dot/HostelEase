// Centralised error-handling middleware for Express
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Details]:', err);
  }

  // 1. Mongoose Bad ObjectId (CastError) -> 400
  if (err.name === 'CastError') {
    const message = `Resource not found with invalid id: ${err.value}`;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // 2. Mongoose Duplicate Key Error (Code 11000) -> 400
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'email') {
      message = 'An account with this email address already exists';
    } else if (field === 'student') {
      message = 'You already have an active room allocation or pending request';
    } else if (field === 'block' || field === 'roomNumber') {
      message = `Room ${err.keyValue.roomNumber || ''} already exists in Block ${err.keyValue.block || ''}`;
    }
    return res.status(400).json({
      success: false,
      message,
      fields: err.keyValue,
    });
  }

  // 3. Mongoose Schema Validation Error -> 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errors: messages,
    });
  }

  // 4. JWT Errors -> 401
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired',
      tokenExpired: true,
    });
  }

  // Default fallback status code -> 500 or err.statusCode
  const statusCode = err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
