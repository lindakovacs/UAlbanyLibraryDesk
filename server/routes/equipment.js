const express = require('express');
const store = require('../data/store');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/equipment
 * @desc    Get equipment collection with optional search and category filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const items = await store.getEquipment({ category, search });
    res.status(200).json({
      status: 'success',
      total: items.length,
      equipment: items
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/equipment/:id
 * @desc    Get equipment record by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const item = await store.getEquipmentById(req.params.id);
    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Equipment with ID '${req.params.id}' not found`,
        status: 404
      });
    }
    res.status(200).json({
      status: 'success',
      equipment: item
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/equipment
 * @desc    Register new equipment in catalog
 */
router.post('/', validateBody(['name', 'category']), async (req, res, next) => {
  try {
    const newItem = await store.createEquipment(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Equipment registered successfully',
      equipment: newItem
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/equipment/:id
 * @desc    Update equipment metadata
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await store.updateEquipment(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Equipment with ID '${req.params.id}' not found`,
        status: 404
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Equipment updated successfully',
      equipment: updated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
