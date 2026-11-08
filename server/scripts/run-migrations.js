const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function runMigrations() {
  console.log('=====================================================');
  console.log(' UAlbany LibraryDesk - Database Migration & Seed');
  console.log('=====================================================');
  console.log(` Target Host : ${config.db.host}:${config.db.port}`);
  console.log(` Target User : ${config.db.user}`);
  console.log(` Database    : ${config.db.database}`);
  console.log('-----------------------------------------------------');

  let connection;
  try {
    // 1. Connect without selecting database first to create database if not exists
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      multipleStatements: true
    });
    console.log('✓ Connected to MySQL server.');

    // 2. Create database if it does not exist
    console.log(`Ensuring database '${config.db.database}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${config.db.database}\`;`);
    console.log(`✓ Active database set to '${config.db.database}'.`);

    // 3. Read and execute init-db.sql
    const sqlFilePath = path.join(__dirname, 'init-db.sql');
    console.log(`Reading SQL schema from ${sqlFilePath}...`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing database schema and seed data...');
    await connection.query(sqlContent);

    // 4. Verify created tables
    const [tables] = await connection.query('SHOW TABLES;');
    const tableNames = tables.map(row => Object.values(row)[0]);

    console.log('\n=====================================================');
    console.log(' Database Initialization Complete!');
    console.log('=====================================================');
    console.log(` Tables created (${tableNames.length}):`);
    tableNames.forEach(t => console.log(`   - ${t}`));
    console.log('\n All seed data for staff, equipment, borrowers, loans, and prep queues inserted.');
    console.log(' Run `npm run db:check` anytime to test connection health.\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);

    console.error('\nTroubleshooting tips:');
    console.error('1. Check if MySQL server is running (e.g. `brew services start mysql` or start MySQL in System Settings).');
    console.error('2. Verify DB_USER and DB_PASSWORD in your `.env` or `server/.env` file.');
    console.error(`3. Confirm MySQL is accessible at ${config.db.host}:${config.db.port}.\n`);

    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // ignore close error
      }
    }
    process.exit(1);
  }
}

runMigrations();
