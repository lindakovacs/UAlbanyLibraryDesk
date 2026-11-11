const express = require('express');
const store = require('../data/store');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/preparation
 * @desc    Get equipment in preparation pipeline
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const items = await store.getPreparation({ status, search });
    res.status(200).json({
      status: 'success',
      total: items.length,
      preparation: items
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/preparation/:id
 * @desc    Get preparation item details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const item = await store.getPreparationById(req.params.id);
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Preparation record with ID '${req.params.id}' not found`,
        status: 404
      });
    }
    res.status(200).json({
      status: 'success',
      preparation: item
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/preparation/:id
 * @desc    Update preparation workflow (assignment, checklist, review)
 */
router.patch('/:id', optionalAuth, async (req, res, next) => {
  try {
    // Only Supervisors can approve equipment readiness and mark ready for lending
    if (req.body && req.body.status === 'ready' && req.user) {
      const role = (req.user.role || '').toLowerCase();
      if (!role.includes('supervisor') && !role.includes('admin')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. Circulation Supervisor role required to approve equipment readiness.',
          status: 403
        });
      }
    }
    const updated = await store.updatePreparation(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Preparation record with ID '${req.params.id}' not found`,
        status: 404
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Preparation task updated successfully',
      preparation: updated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
