const { pool, testConnection } = require('./config/db');
const config = require('./config');

async function checkDatabase() {
  console.log('=====================================================');
  console.log(' UAlbany LibraryDesk - MySQL Health & Diagnostics');
  console.log('=====================================================');
  console.log(` Target Host : ${config.db.host}:${config.db.port}`);
  console.log(` Target User : ${config.db.user}`);
  console.log(` Database    : ${config.db.database}`);
  console.log('-----------------------------------------------------');

  const result = await testConnection();

  if (!result.success) {
    console.error('\n❌ MySQL Connection Failed:');
    console.error(`   ${result.message}`);
    if (result.code) console.error(`   Error Code: ${result.code}`);

    console.log('\n💡 Resolution Guide:');
    console.log('1. Ensure MySQL Server is running:');
    console.log('   - macOS (Homebrew): brew services start mysql');
    console.log('   - Windows / Mac (MySQL Installer): Start MySQL service in System Settings / Services');
    console.log('   - Docker: docker run --name ualbany-mysql -e MYSQL_ROOT_PASSWORD=your_actual_password_here -e MYSQL_DATABASE=ualbanylibrarydesk -p 3306:3306 -d mysql:latest');
    console.log('2. Check your `.env` credentials:');
    console.log(`   - Host     : ${config.db.host}`);
    console.log(`   - Port     : ${config.db.port}`);
    console.log(`   - User     : ${config.db.user}`);
    console.log(`   - Database : ${config.db.database}`);
    console.log('3. If the database does not exist yet, run:');
    console.log('   npm run db:init\n');

    process.exit(1);
  }

  console.log('✓ MySQL Server Connected Successfully!');
  console.log(`  Version: ${result.serverVersion}`);

  try {
    const [tables] = await pool.query('SHOW TABLES;');
    const tableNames = tables.map(r => Object.values(r)[0]);

    if (tableNames.length === 0) {
      console.log('\n⚠️  Database exists, but no tables were found.');
      console.log('👉 Run schema initialization:');
      console.log('   npm run db:init\n');
    } else {
      console.log(`\n✓ Found ${tableNames.length} tables in database '${config.db.database}':`);
      for (const table of tableNames) {
        const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\`;`);
        console.log(`   - ${table.padEnd(28)} : ${countRow.total} records`);
      }
      console.log('\n🎉 Database is healthy, schema verified, and ready for circulation operations!\n');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error querying database metadata: ${err.message}`);
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();
