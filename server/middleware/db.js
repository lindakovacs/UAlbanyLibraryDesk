const db = require('../config/db');

/**
 * Middleware that attaches database access functions to the Express request object
 */
function dbMiddleware(req, res, next) {
  req.db = db;
  next();
}

module.exports = dbMiddleware;
