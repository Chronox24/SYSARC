const mysql = require("mysql2/promise");

(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'brgy_database',
    });

    const connection = await pool.getConnection();

    // Ensure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resident_archive_folders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure column exists
    try {
      await connection.query('ALTER TABLE residents ADD COLUMN archive_folder_id INT DEFAULT NULL');
      console.log('Added archive_folder_id to residents table');
    } catch (e) {
      if (!e.message.includes('Duplicate column')) {
        console.error(e.message);
      }
    }

    // Also check if the backend has the endpoint for /api/admin/resident-archive-folders
    // If we just add them to the database, the frontend might not see them if the endpoint is missing!

    const folders = ['2023', '2024', '2025'];
    const folderIds = {};

    for (let folder of folders) {
      const [rows] = await connection.query('SELECT id FROM resident_archive_folders WHERE name = ?', [folder]);
      if (rows.length > 0) {
        folderIds[folder] = rows[0].id;
      } else {
        const [result] = await connection.query('INSERT INTO resident_archive_folders (name) VALUES (?)', [folder]);
        folderIds[folder] = result.insertId;
      }
    }

    const firstNames = ['Juan', 'Maria', 'Pedro', 'Jose', 'Ana', 'Luis', 'Carlos', 'Miguel', 'Rosa', 'Carmen'];
    const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Cruz', 'Flores'];

    let count = 0;
    
    // Insert 100 unassigned
    for(let i = 0; i < 100; i++) {
        const name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)] + ' ' + count;
        const email = `archived_unassigned_${count}@test.com`;
        await connection.query(`
            INSERT INTO residents (full_name, email, password, is_archived, is_verified, archive_folder_id) 
            VALUES (?, ?, 'password123', 'Yes', 'Approved', NULL)
        `, [name, email]);
        count++;
    }
    console.log("Inserted 100 unassigned");

    // Insert 100 for each folder
    for (let folder of folders) {
        let fId = folderIds[folder];
        for(let i = 0; i < 100; i++) {
            const name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)] + ' ' + count;
            const email = `archived_${folder}_${count}@test.com`;
            await connection.query(`
                INSERT INTO residents (full_name, email, password, is_archived, is_verified, archive_folder_id) 
                VALUES (?, ?, 'password123', 'Yes', 'Approved', ?)
            `, [name, email, fId]);
            count++;
        }
        console.log(`Inserted 100 for ${folder}`);
    }

    console.log("Finished inserting 400 total dummy archived residents.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
