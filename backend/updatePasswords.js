const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/estadias_db_real'
});

async function run() {
  const hash = await bcrypt.hash('123456', 10);
  await pool.query('UPDATE usuarios SET password_hash = $1', [hash]);
  console.log('Done');
  process.exit(0);
}
run();
