const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Check both server/.env and root .env
const serverEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  version: process.env.npm_package_version || '1.0.0',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // JWT Authentication settings
  jwt: {
    secret: process.env.JWT_SECRET || 'ualbany_librarydesk_super_secret_jwt_key_2026',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },

  // Database settings
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'ualbanylibrarydesk',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
  }
};

module.exports = config;
