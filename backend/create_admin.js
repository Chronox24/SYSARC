const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'brgy_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const connection = await pool.getConnection();
  try {
    const email = 'sysarch.admin@local';
    const password = 'Admin@2026!';
    const name = 'SYSARCH Admin';
    const role = 'Administrator';

    const [existing] = await connection.execute('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length) {
      console.log('Admin already exists with id', existing[0].id);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO admins (name, role, email, password) VALUES (?, ?, ?, ?)',
      [name, role, email, hash]
    );

    console.log('Created admin with id', result.insertId);
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await connection.release();
    await pool.end();
  }
})();
