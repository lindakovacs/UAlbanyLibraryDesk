const express = require('express');
const store = require('../data/store');

const router = express.Router();

/**
 * @route   GET /api/preparation
 * @desc    Get equipment in preparation pipeline
 */
router.get('/', (req, res) => {
  const { status, search } = req.query;
  const items = store.getPreparation({ status, search });
  res.status(200).json({
    status: 'success',
    total: items.length,
    preparation: items
  });
});

/**
 * @route   GET /api/preparation/:id
 * @desc    Get preparation item details
 */
router.get('/:id', (req, res) => {
  const item = store.getPreparationById(req.params.id);
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
});

/**
 * @route   PATCH /api/preparation/:id
 * @desc    Update preparation workflow (assignment, checklist, review)
 */
router.patch('/:id', (req, res) => {
  const updated = store.updatePreparation(req.params.id, req.body);
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
});

module.exports = router;
