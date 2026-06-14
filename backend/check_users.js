const mysql = require('mysql2/promise');
(async () => {
  try {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'brgy_database' });
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, email, is_verified FROM residents LIMIT 10');
    console.log(JSON.stringify(rows, null, 2));
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
