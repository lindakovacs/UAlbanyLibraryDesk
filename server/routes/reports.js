const express = require('express');
const store = require('../data/store');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/reports/summary
 * @desc    Get circulation and preparation KPI summary metrics
 */
router.get('/summary', async (req, res, next) => {
  try {
    const kpis = await store.getSummaryKPIs();
    res.status(200).json({
      status: 'success',
      kpis
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/reports
 * @desc    Get equipment utilization reports (Supervisors only when authenticated)
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    if (req.user) {
      const role = (req.user.role || '').toLowerCase();
      if (!role.includes('supervisor') && !role.includes('admin')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. Circulation Supervisor role required to access circulation reports.',
          status: 403
        });
      }
    }
    const { category, search, semester, from, to } = req.query;
    const reports = await store.getReports({ category, search, semester, from, to });
    res.status(200).json({
      status: 'success',
      total: reports.length,
      reports
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
