const ApiError = require('../utils/ApiError');

function buildErrorResponse(err) {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || 'An unexpected error occurred. Please try again later.',
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500 && !err.isOperational) {
    response.stack = err.stack;
  }

  return { statusCode, response };
}

const errorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body. Please check your request format.',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired. Please log in again.',
    });
  }

  const { statusCode, response } = buildErrorResponse(err);

  if (statusCode === 500 && !err.isOperational) {
    console.error(`[${req.method}] ${req.originalUrl}`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
