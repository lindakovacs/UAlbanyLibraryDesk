const express = require('express');
const config = require('../config');

const router = express.Router();

/**
 * @route   GET /health (or /api/health)
 * @desc    Liveness health check endpoint
 * @access  Public
 */
router.get('/health', async (req, res) => {
  let dbInfo = { status: 'standby' };
  try {
    if (req.db && typeof req.db.testConnection === 'function') {
      const dbTest = await req.db.testConnection();
      dbInfo = {
        status: dbTest.success ? 'connected' : 'disconnected',
        database: config.db.database,
        host: config.db.host
      };
      if (dbTest.serverVersion) dbInfo.serverVersion = dbTest.serverVersion;
    }
  } catch (e) {
    dbInfo = { status: 'error', message: e.message };
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    version: config.version,
    database: dbInfo
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
