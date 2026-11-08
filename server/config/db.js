const mysql = require('mysql2/promise');
const config = require('./index');

// Create a connection pool for MySQL
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Execute a parameterized SQL query using the connection pool
 * @param {string} sql - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Array>} - Query results
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error(`[MySQL Query Error]: ${error.message}`);
    throw error;
  }
}

/**
 * Test connectivity to MySQL database server
 * @returns {Promise<{success: boolean, message: string, serverInfo?: object}>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS test, VERSION() AS mysql_version;');
    connection.release();
    return {
      success: true,
      message: 'Successfully connected to MySQL database',
      serverVersion: rows[0].mysql_version,
      database: config.db.database,
      host: config.db.host
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: error.code,
      host: config.db.host,
      database: config.db.database
    };
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
