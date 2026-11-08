const app = require('./app');
const config = require('./config');
const { testConnection } = require('./config/db');

const server = app.listen(config.port, async () => {
  console.log(`===============================================`);
  console.log(` UAlbany LibraryDesk API Server running`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Port        : ${config.port}`);
  console.log(` Health check: http://localhost:${config.port}/health`);
  console.log(` API Health  : http://localhost:${config.port}/api/health`);
  console.log(` Static UI   : http://localhost:${config.port}/`);
  console.log(` Frontend URL: ${config.frontendUrl}`);
  console.log(`-----------------------------------------------`);

  // Asynchronously verify MySQL connectivity on startup
  const dbStatus = await testConnection();
  if (dbStatus.success) {
    console.log(` MySQL DB    : Connected (v${dbStatus.serverVersion}) -> ${config.db.database}`);
  } else {
    console.log(` MySQL DB    : Offline / Standby (${dbStatus.message})`);
    console.log(`               Tip: Run 'npm run db:check' or 'npm run db:init'`);
  }
  console.log(`===============================================`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
