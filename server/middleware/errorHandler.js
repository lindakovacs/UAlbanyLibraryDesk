const config = require('../config');

/**
 * 404 Not Found middleware for unmatched routes
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    status: 404
  });
}

/**
 * Centralized error-handling middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    error: statusCode >= 500 ? 'Internal Server Error' : (err.name || 'Error'),
    message: statusCode >= 500 && config.isProduction ? 'An unexpected error occurred' : message,
    status: statusCode
  };

  if (!config.isProduction && err.stack) {
    response.stack = err.stack;
  }

  if (statusCode >= 500 && !config.isTest) {
    console.error('Server Error:', err);
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
