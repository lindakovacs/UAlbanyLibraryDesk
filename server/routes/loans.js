const express = require('express');
const store = require('../data/store');
const { validateBody, validateEnum } = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/loans
 * @desc    Get equipment loans with status and search filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const loans = await store.getLoans({ status, search });
    res.status(200).json({
      status: 'success',
      total: loans.length,
      loans
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/loans/:id
 * @desc    Get loan record by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const loan = await store.getLoanById(req.params.id);
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
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/loans
 * @desc    Check out equipment to borrower
 */
router.post(
  '/',
  validateBody(['netid', 'equipmentId']),
  async (req, res, next) => {
    try {
      const { netid, equipmentId } = req.body;
      const eq = await store.getEquipmentById(equipmentId);
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

      const newLoan = await store.createLoan(req.body);
      res.status(201).json({
        status: 'success',
        message: `Equipment ${newLoan.equipmentName} checked out to ${newLoan.borrowerName}`,
        loan: newLoan
      });
    } catch (err) {
      next(err);
    }
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
  async (req, res, next) => {
    try {
      const loan = await store.returnLoan(req.params.id, req.body);
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
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
