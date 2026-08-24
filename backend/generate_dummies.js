const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'brgy_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const connection = await pool.getConnection();

  try {
    console.log("Connected to brgy_database. Cleaning up previous dummy records...");

    // Clean up previous dummy records
    await connection.execute(`
      DELETE FROM profile_update_requests 
      WHERE user_id IN (SELECT id FROM residents WHERE email LIKE 'dummy.resident.%@example.com')
    `);
    await connection.execute(`
      DELETE FROM certificate_requests 
      WHERE user_id IN (SELECT id FROM residents WHERE email LIKE 'dummy.resident.%@example.com')
    `);
    await connection.execute(`
      DELETE FROM messages 
      WHERE user_id IN (SELECT id FROM residents WHERE email LIKE 'dummy.resident.%@example.com')
    `);
    await connection.execute(`
      DELETE FROM residents 
      WHERE email LIKE 'dummy.resident.%@example.com'
    `);
    await connection.execute(`
      DELETE FROM residents 
      WHERE email LIKE 'dummy.resident.archived.2025.%@example.com'
    `);

    console.log("Cleanup finished. Generating 100 dummy residents...");

    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const nicknames = ['Jim', 'Jenn', 'Rob', 'Liz', 'Dave', 'Will', 'Barb', 'Rick', 'Sue', 'Joe', 'Sally', 'Tom', 'Char', 'Kar', 'Bob', 'Mimi', 'Johnny', 'Pete', 'Nico', 'AJ'];
    const genders = ['Male', 'Female'];
    const civilStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
    const religions = ['Roman Catholic', 'Christian', 'Islam', 'Iglesia ni Cristo', 'None'];
    const barangays = ['Barangay 830', 'Barangay 831', 'Barangay 832'];
    const cities = ['Manila', 'Quezon City', 'Makati', 'Pasig'];
    const streets = ['Rizal Ave', 'Taft Ave', 'Aurora Blvd', 'España Blvd', 'Quirino Ave'];

    const hashedPassword = await bcrypt.hash('password123', 10);
    const residentIds = [];

    // Generate 100 residents
    for (let i = 1; i <= 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
      const email = `dummy.resident.${i}@example.com`;
      const age = Math.floor(Math.random() * 50) + 18; // 18 to 67
      const birthYear = new Date().getFullYear() - age;
      const dateOfBirth = `${birthYear}-01-01`;
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const religion = religions[Math.floor(Math.random() * religions.length)];
      const civilStatus = civilStatuses[Math.floor(Math.random() * civilStatuses.length)];
      const barangay = barangays[Math.floor(Math.random() * barangays.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const homeAddress = `${Math.floor(Math.random() * 200) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, ${barangay}, ${city}`;
      const mobilePhone = `09${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Verification status distribution: ~80% Approved, ~10% Pending, ~10% Rejected
      let isVerified = 'Approved';
      const rand = Math.random();
      if (rand < 0.1) {
        isVerified = 'Pending';
      } else if (rand < 0.2) {
        isVerified = 'Rejected';
      }

      const [result] = await connection.execute(
        `INSERT INTO residents (
          full_name, nickname, email, password, date_of_birth, age, gender, religion, 
          civil_status, barangay, city_municipality, home_address, mobile_phone, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, nickname, email, hashedPassword, dateOfBirth, age, gender, religion, civilStatus, barangay, city, homeAddress, mobilePhone, isVerified]
      );

      residentIds.push(result.insertId);
    }

    console.log(`Successfully generated 100 residents.`);

    // Generate 100 Certificate Requests
    console.log("Generating 100 dummy certificate requests...");
    const certTypes = ['Barangay Clearance', 'Certificate of Residency', 'Certificate of Indigency', 'Business Permit'];
    const verStatuses = ['Verified', 'Not Verified', 'Not Valid'];
    const procStatuses = ['In process', 'For Pickup', 'Claimed', 'Void'];

    for (let i = 1; i <= 100; i++) {
      // Pick a random resident ID
      const userId = residentIds[Math.floor(Math.random() * residentIds.length)];
      const certType = certTypes[Math.floor(Math.random() * certTypes.length)];
      const verStatus = verStatuses[Math.floor(Math.random() * verStatuses.length)];
      const procStatus = procStatuses[Math.floor(Math.random() * procStatuses.length)];
      const content = `This is dummy certificate content for request #${i}. All details verified.`;

      await connection.execute(
        `INSERT INTO certificate_requests (user_id, certificate_type, verification_status, process_status, certificate_content) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, certType, verStatus, procStatus, content]
      );
    }

    console.log(`Successfully generated 100 certificate requests.`);

    // Generate 100 Profile Update Requests (Requests)
    console.log("Generating 100 dummy profile update requests...");
    for (let i = 1; i <= 100; i++) {
      // Pick a random resident ID
      const userId = residentIds[Math.floor(Math.random() * residentIds.length)];
      
      // Let's query this resident to display realistic changes
      const [resRows] = await connection.execute("SELECT * FROM residents WHERE id = ?", [userId]);
      const resident = resRows[0];

      // Request changes
      const requestedNickname = resident.nickname + " (New)";
      const requestedMobile = `09${Math.floor(100000000 + Math.random() * 900000000)}`;
      const requestedAddress = resident.home_address + " (Updated)";
      const status = 'Pending'; // Keep it pending so the admin sees the requests

      await connection.execute(
        `INSERT INTO profile_update_requests (
          user_id, full_name, nickname, gender, age, date_of_birth, religion, civil_status, 
          barangay, city_municipality, home_address, mobile_phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, resident.full_name, requestedNickname, resident.gender, resident.age, resident.date_of_birth, 
          resident.religion, resident.civil_status, resident.barangay, resident.city_municipality, 
          requestedAddress, requestedMobile, status
        ]
      );
    }

    console.log(`Successfully generated 100 profile update requests.`);

    // Check and create folder '2025'
    console.log("Ensuring '2025' archive folder exists...");
    let folderId;
    const [folderRows] = await connection.execute("SELECT id FROM resident_archive_folders WHERE name = '2025'");
    if (folderRows.length > 0) {
      folderId = folderRows[0].id;
      console.log(`Found existing '2025' folder with ID: ${folderId}`);
    } else {
      const [insertFolderResult] = await connection.execute("INSERT INTO resident_archive_folders (name) VALUES ('2025')");
      folderId = insertFolderResult.insertId;
      console.log(`Created new '2025' folder with ID: ${folderId}`);
    }

    console.log("Generating 100 dummy archived residents for '2025' folder...");
    for (let i = 1; i <= 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
      const email = `dummy.resident.archived.2025.${i}@example.com`;
      const age = Math.floor(Math.random() * 50) + 18;
      const birthYear = new Date().getFullYear() - age;
      const dateOfBirth = `${birthYear}-01-01`;
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const religion = religions[Math.floor(Math.random() * religions.length)];
      const civilStatus = civilStatuses[Math.floor(Math.random() * civilStatuses.length)];
      const barangay = barangays[Math.floor(Math.random() * barangays.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const homeAddress = `${Math.floor(Math.random() * 200) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, ${barangay}, ${city}`;
      const mobilePhone = `09${Math.floor(100000000 + Math.random() * 900000000)}`;

      await connection.execute(
        `INSERT INTO residents (
          full_name, nickname, email, password, date_of_birth, age, gender, religion, 
          civil_status, barangay, city_municipality, home_address, mobile_phone, 
          is_verified, is_archived, archived_at, archive_folder_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', 'Yes', NOW(), ?)`,
        [
          fullName, nickname, email, hashedPassword, dateOfBirth, age, gender, religion, 
          civilStatus, barangay, city, homeAddress, mobilePhone, folderId
        ]
      );
    }

    console.log(`Successfully generated 100 dummy archived residents in folder '2025'.`);
    console.log("All dummy data inserted successfully!");

  } catch (error) {
    console.error("Error generating dummy data:", error);
  } finally {
    await connection.release();
    await pool.end();
  }
}

main();
