const express = require('express');
const config = require('../config');

const router = express.Router();

/**
 * @route   GET /health (or /api/health)
 * @desc    Liveness health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    version: config.version
  });
});

/**
 * @route   GET /ready (or /api/ready)
 * @desc    Readiness probe endpoint
 * @access  Public
 */
router.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

module.exports = router;
