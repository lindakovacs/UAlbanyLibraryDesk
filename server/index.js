const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` UAlbany LibraryDesk API Server running`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Port        : ${config.port}`);
  console.log(` Health check: http://localhost:${config.port}/health`);
  console.log(` API Health  : http://localhost:${config.port}/api/health`);
  console.log(` Static UI   : http://localhost:${config.port}/`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close if graceful shutdown takes longer than 5 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
