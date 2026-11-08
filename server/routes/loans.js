const express = require('express');
const store = require('../data/store');
const { validateBody, validateEnum } = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/loans
 * @desc    Get equipment loans with status and search filters
 */
router.get('/', (req, res) => {
  const { status, search } = req.query;
  const loans = store.getLoans({ status, search });
  res.status(200).json({
    status: 'success',
    total: loans.length,
    loans
  });
});

/**
 * @route   GET /api/loans/:id
 * @desc    Get loan record by ID
 */
router.get('/:id', (req, res) => {
  const loan = store.getLoanById(req.params.id);
  if (!loan) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Loan with ID '${req.params.id}' not found`,
      status: 404
    });
  }
  res.status(200).json({
    status: 'success',
    loan
  });
});

/**
 * @route   POST /api/loans
 * @desc    Check out equipment to borrower
 */
router.post(
  '/',
  validateBody(['netid', 'equipmentId']),
  (req, res) => {
    const { netid, equipmentId } = req.body;
    const eq = store.getEquipmentById(equipmentId);
    if (!eq) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Equipment item '${equipmentId}' not found`,
        status: 404
      });
    }

    if (eq.available <= 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Equipment item '${eq.name}' (${equipmentId}) is currently out of stock`,
        status: 409
      });
    }

    const newLoan = store.createLoan(req.body);
    res.status(201).json({
      status: 'success',
      message: `Equipment ${newLoan.equipmentName} checked out to ${newLoan.borrowerName}`,
      loan: newLoan
    });
  }
);

/**
 * @route   POST /api/loans/:id/return
 * @desc    Check in / return borrowed equipment
 */
router.post(
  '/:id/return',
  validateBody(['condition', 'destination']),
  validateEnum('condition', ['good', 'cleaning', 'minor-wear', 'missing-accessory', 'damaged']),
  validateEnum('destination', ['ready-shelf', 'prep-queue', 'tech-hold']),
  (req, res) => {
    const loan = store.returnLoan(req.params.id, req.body);
    if (!loan) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Loan with ID '${req.params.id}' not found`,
        status: 404
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Loan ${loan.id} returned successfully. Routed to ${loan.destination}.`,
      loan
    });
  }
);

module.exports = router;
