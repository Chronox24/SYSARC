const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'brgy_database',
  });

  try {
    const connection = await pool.getConnection();
    console.log("Connected. Seeding 100 dummy records...");

    const types = ['Barangay Clearance', 'Certificate of Residency', 'Certificate of Indigency', 'Business Permit'];
    const vStatus = ['Verified', 'Not Verified', 'Not Valid'];
    const pStatus = ['In process', 'For Pickup', 'Claimed', 'Void'];

    const hashedPassword = await bcrypt.hash('password123', 10);

    let inserted = 0;
    for (let i = 1; i <= 100; i++) {
      const name = `Dummy Resident ${Date.now()}_${i}`;
      const email = `dummy${Date.now()}_${i}@test.com`;
      
      // Insert Resident
      const [resResult] = await connection.query(
        'INSERT INTO residents (full_name, email, password, home_address) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, `Dummy Address Block ${i}, Barangay Test`]
      );
      
      const residentId = resResult.insertId;

      // Insert Request
      const type = types[Math.floor(Math.random() * types.length)];
      
      const isVerified = Math.random() > 0.5;
      const vs = isVerified ? 'Verified' : 'Not Verified';
      const ps = isVerified ? pStatus[Math.floor(Math.random() * pStatus.length)] : 'In process';
      
      await connection.query(
        'INSERT INTO certificate_requests (user_id, certificate_type, verification_status, process_status) VALUES (?, ?, ?, ?)',
        [residentId, type, vs, ps]
      );
      inserted++;
    }
    
    console.log(`Successfully seeded ${inserted} records!`);
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
