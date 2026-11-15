const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./middleware/logger');
const dbMiddleware = require('./middleware/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route modules
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const borrowersRoutes = require('./routes/borrowers');
const loansRoutes = require('./routes/loans');
const preparationRoutes = require('./routes/preparation');
const reportsRoutes = require('./routes/reports');

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

// Database middleware (attaches req.db)
app.use(dbMiddleware);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health & readiness routes
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// API Resource routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/borrowers', borrowersRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/preparation', preparationRoutes);
app.use('/api/reports', reportsRoutes);

// Helper to parse cookies from incoming HTTP requests
function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers && req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name ? name.trim() : '';
    if (name) {
      list[name] = decodeURIComponent(rest.join('=').trim());
    }
  });
  return list;
}

// Server-side Authentication Guard: Protect root and staff HTML pages
app.use((req, res, next) => {
  const reqPath = req.path.toLowerCase();

  const isRoot = reqPath === '/';
  const isHtml = reqPath.endsWith('.html');
  const isLoginPage = reqPath === '/login.html' || reqPath === '/login';

  if ((isRoot || isHtml) && !isLoginPage) {
    const cookies = parseCookies(req);
    if (!cookies.librarydesk_session) {
      const redirectQuery = (!isRoot && reqPath !== '/index.html')
        ? `?redirect=${encodeURIComponent(req.originalUrl || reqPath)}`
        : '';
      return res.redirect(302, `/login.html${redirectQuery}`);
    }
  }
  next();
});

// Serve static frontend assets (HTML, CSS, client-side JS, images)
const publicDir = path.resolve(__dirname, '..');
app.use(express.static(publicDir, {
  dotfiles: 'ignore',
  index: 'index.html',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
