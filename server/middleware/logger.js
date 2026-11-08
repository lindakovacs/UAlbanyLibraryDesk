const morgan = require('morgan');
const config = require('../config');

// In test environment, skip logging to keep test runner output clean
const skip = () => config.isTest;

const format = config.isProduction ? 'combined' : 'dev';

const logger = morgan(format, { skip });

module.exports = logger;
