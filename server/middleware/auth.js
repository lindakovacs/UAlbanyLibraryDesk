const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authentication middleware that verifies JWT Bearer token
 * Attaches decoded user payload to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No authentication token provided.',
      status: 401
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.name === 'TokenExpiredError' 
        ? 'Authentication token has expired. Sign in again.' 
        : 'Invalid authentication token.',
      status: 401
    });
  }
}

/**
 * Optional authentication: attaches user if token is valid, but allows unauthenticated requests
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      req.user = jwt.verify(token, config.jwt.secret);
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
