const express = require('express');
const store = require('../data/store');

const router = express.Router();

/**
 * @route   GET /api/reports/summary
 * @desc    Get circulation and preparation KPI summary metrics
 */
router.get('/summary', (req, res) => {
  const kpis = store.getSummaryKPIs();
  res.status(200).json({
    status: 'success',
    kpis
  });
});

/**
 * @route   GET /api/reports
 * @desc    Get equipment utilization reports
 */
router.get('/', (req, res) => {
  const { category, search } = req.query;
  const reports = store.getReports({ category, search });
  res.status(200).json({
    status: 'success',
    total: reports.length,
    reports
  });
});

module.exports = router;
