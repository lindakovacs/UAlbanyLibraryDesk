const express = require('express');
const store = require('../data/store');

const router = express.Router();

/**
 * @route   GET /api/borrowers
 * @desc    Get borrower directory with search and status filters
 */
router.get('/', (req, res) => {
  const { status, search } = req.query;
  const borrowers = store.getBorrowers({ status, search });
  res.status(200).json({
    status: 'success',
    total: borrowers.length,
    borrowers
  });
});

/**
 * @route   GET /api/borrowers/:netid
 * @desc    Get borrower details and active loans by NetID
 */
router.get('/:netid', (req, res) => {
  const borrower = store.getBorrowerByNetId(req.params.netid);
  if (!borrower) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Borrower with NetID '${req.params.netid}' not found`,
      status: 404
    });
  }

  const loans = store.getLoans({ search: req.params.netid });

  res.status(200).json({
    status: 'success',
    borrower: {
      ...borrower,
      loans
    }
  });
});

module.exports = router;
