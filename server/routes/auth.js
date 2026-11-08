const express = require('express');
const store = require('../data/store');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate staff user using UAlbany NetID
 * @access  Public
 */
router.post('/login', validateBody(['netid', 'password']), (req, res) => {
  const { netid, password } = req.body;
  const session = store.login(netid, password);
  res.status(200).json({
    status: 'success',
    message: `Signed in successfully as ${netid}`,
    session
  });
});

/**
 * @route   GET /api/auth/session
 * @desc    Get active staff session and workstation permissions
 * @access  Public
 */
router.get('/session', (req, res) => {
  const session = store.getSession();
  res.status(200).json({
    status: 'success',
    session
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Sign out of circulation workstation
 * @access  Public
 */
router.post('/logout', (req, res) => {
  const result = store.logout();
  res.status(200).json({
    status: 'success',
    message: 'Signed out successfully',
    ...result
  });
});

module.exports = router;
