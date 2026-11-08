const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();

// Security / CORS configuration
const corsOptions = {
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// HTTP request logging
app.use(logger);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health & readiness routes (mounted at root and /api for convenience)
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// Serve static frontend assets (HTML, CSS, client-side JS, images)
const publicDir = path.resolve(__dirname, '..');
app.use(express.static(publicDir, {
  dotfiles: 'ignore',
  index: 'index.html'
}));

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
