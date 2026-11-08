const express = require('express');
const store = require('../data/store');

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
 * @desc    Get equipment utilization reports
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const reports = await store.getReports({ category, search });
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
