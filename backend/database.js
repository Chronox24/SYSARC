const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // limit files to 2MB each
});

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'brgy_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✓ MySQL database connected successfully!");

    try {
      await connection.query("SET GLOBAL max_allowed_packet = 67108864");
      console.log("✓ Global max_allowed_packet set to 64MB");
    } catch (packetErr) {
      console.warn("⚠️ Could not set max_allowed_packet:", packetErr.message);
    }
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS residents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        nickname VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        date_of_birth VARCHAR(255),
        age INT,
        gender VARCHAR(50),
        religion VARCHAR(255),
        civil_status VARCHAR(50),
        barangay VARCHAR(255),
        city_municipality VARCHAR(255),
        home_address TEXT,
        mobile_phone VARCHAR(20),
        post_grad_course VARCHAR(255),
        post_grad_year VARCHAR(4),
        college_course VARCHAR(255),
        college_year VARCHAR(4),
        high_school VARCHAR(255),
        high_school_year VARCHAR(4),
        elementary VARCHAR(255),
        elementary_year VARCHAR(4),
        other_education VARCHAR(255),
        other_year VARCHAR(4),
        emergency_name VARCHAR(255),
        emergency_phone VARCHAR(20),
        relationship VARCHAR(50),
        signature_file LONGBLOB,
        photo LONGBLOB,
        id_photo LONGBLOB,
        is_verified ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        is_archived ENUM('No', 'Yes') DEFAULT 'No',
        archived_at DATETIME DEFAULT NULL,
        area VARCHAR(255),
        other_area VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS profile_update_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        full_name VARCHAR(255),
        nickname VARCHAR(255),
        gender VARCHAR(50),
        age INT,
        date_of_birth VARCHAR(255),
        religion VARCHAR(255),
        civil_status VARCHAR(50),
        barangay VARCHAR(255),
        city_municipality VARCHAR(255),
        home_address TEXT,
        mobile_phone VARCHAR(20),
        post_grad_course VARCHAR(255),
        post_grad_year VARCHAR(4),
        college_course VARCHAR(255),
        college_year VARCHAR(4),
        high_school VARCHAR(255),
        high_school_year VARCHAR(4),
        elementary VARCHAR(255),
        elementary_year VARCHAR(4),
        other_education VARCHAR(255),
        other_year VARCHAR(4),
        emergency_name VARCHAR(255),
        emergency_phone VARCHAR(20),
        relationship VARCHAR(50),
        photo LONGBLOB,
        id_photo LONGBLOB,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES residents(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS certificate_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        certificate_type VARCHAR(255) NOT NULL,
        verification_status VARCHAR(50) DEFAULT 'Not Verified',
        process_status ENUM('In process', 'For Pickup', 'Claimed', 'Void') DEFAULT 'In process',
        certificate_content TEXT,
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES residents(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        role VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            sender ENUM('resident', 'admin') NOT NULL,
            message_text TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES residents(id)
        )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS archive_folders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES archive_folders(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS archive_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        folder_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        file_data LONGBLOB NOT NULL,
        uploaded_by VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES archive_folders(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS resident_archive_folders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES resident_archive_folders(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS id_photo LONGBLOB;`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS archive_folder_id INT DEFAULT NULL;`);
    await connection.query(`ALTER TABLE residents ADD CONSTRAINT fk_resident_archive_folder FOREIGN KEY (archive_folder_id) REFERENCES resident_archive_folders(id) ON DELETE SET NULL;`).catch(() => {}); // Catch if constraint already exists

    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS is_verified ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending';`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS is_archived ENUM('No', 'Yes') DEFAULT 'No';`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS archived_at DATETIME DEFAULT NULL;`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS area VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS other_area VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS religion VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS barangay VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS city_municipality VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS home_address TEXT;`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS post_grad_course VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS post_grad_year VARCHAR(4);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS college_course VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS college_year VARCHAR(4);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS high_school VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS high_school_year VARCHAR(4);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS elementary VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS elementary_year VARCHAR(4);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS other_education VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS other_year VARCHAR(4);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(255);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS relationship VARCHAR(50);`);
    await connection.query(`ALTER TABLE residents ADD COLUMN IF NOT EXISTS signature_file LONGBLOB;`);
    
    await connection.query(`ALTER TABLE profile_update_requests ADD COLUMN IF NOT EXISTS area VARCHAR(255);`);
    await connection.query(`ALTER TABLE profile_update_requests ADD COLUMN IF NOT EXISTS other_area VARCHAR(255);`);
    
    console.log("✓ Database tables created/verified!");

    const adminEmail = 'sysarch.admin@local';
    const adminPassword = 'Admin@2026!';
    const legacyAdminEmail = 'admin@brgy830.com';
    const [adminRows] = await connection.execute("SELECT id FROM admins WHERE email = ?", [adminEmail]);
    if (adminRows.length === 0) {
      const [legacyRows] = await connection.execute("SELECT id FROM admins WHERE email = ?", [legacyAdminEmail]);
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      if (legacyRows.length > 0) {
        await connection.execute(
          "UPDATE admins SET email = ?, name = ?, role = ?, password = ? WHERE id = ?",
          [adminEmail, 'SYSARCH Admin', 'Administrator', hashedAdminPassword, legacyRows[0].id]
        );
        console.log(`✓ Legacy admin migrated to ${adminEmail}`);
      } else {
        await connection.execute(
          "INSERT INTO admins (name, role, email, password) VALUES (?, ?, ?, ?)",
          ['SYSARCH Admin', 'Administrator', adminEmail, hashedAdminPassword]
        );
        console.log(`✓ Default admin created: ${adminEmail} / ${adminPassword}`);
      }
    } else {
      console.log(`✓ Admin account already exists: ${adminEmail}`);
    }

    connection.release();
  } catch (err) {
    console.error("✗ Database initialization error:", err.message);
  }
})();

// --- AUTH ROUTES ---

app.post("/api/register", upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'idPhoto', maxCount: 1 }, { name: 'id_photo', maxCount: 1 }]), async (req, res) => {
    try {
        const { FullName, Nickname, EmailAddress, Password, DateofBirth, Gender, Age, Religion, CivilStatus, Barangay, 'City/Municipality': CityMunicipality, HomeAddress, MobilePhone, 'Post Graduate Degree/course': PostGraduateCourse, PostGraduateYear, CollegeDegree, CollegeYear, HighSchool, HighSchoolYear, Elementary, ElementaryYear, Others: OtherEducation, OthersYear: OtherYear, EmergencyContactName, EmergencyContactRelation: EmergencyRelation, EmergencyContactPhone: EmergencyPhone, Area, OtherArea } = req.body;
        if (!FullName || !EmailAddress || !Password) return res.status(400).json({ message: "Missing required fields" });
        const hashedPassword = await bcrypt.hash(Password, 10);
        const photoData = req.files?.photo?.[0]?.buffer || null;
        const idPhotoData = req.files?.idPhoto?.[0]?.buffer || req.files?.id_photo?.[0]?.buffer || null;
        const connection = await pool.getConnection();
        try {
            const result = await connection.execute(
                `INSERT INTO residents (full_name, nickname, email, password, date_of_birth, age, gender, religion, civil_status, barangay, city_municipality, home_address, mobile_phone, post_grad_course, post_grad_year, college_course, college_year, high_school, high_school_year, elementary, elementary_year, other_education, other_year, emergency_name, emergency_phone, relationship, photo, id_photo, is_verified, area, other_area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
                [FullName, Nickname || null, EmailAddress, hashedPassword, DateofBirth || null, Age || null, Gender || null, Religion || null, CivilStatus || null, Barangay || null, CityMunicipality || null, HomeAddress || null, MobilePhone || null, PostGraduateCourse || null, PostGraduateYear || null, CollegeDegree || null, CollegeYear || null, HighSchool || null, HighSchoolYear || null, Elementary || null, ElementaryYear || null, OtherEducation || null, OtherYear || null, EmergencyContactName || null, EmergencyPhone || null, EmergencyRelation || null, photoData, idPhotoData, Area || null, OtherArea || null]
            );
            res.json({ message: "Registration submitted for admin verification. You will receive an email once approved.", userId: result[0].insertId });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email already exists" });
            res.status(500).json({ message: "Registration failed: " + err.message });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[LOGIN] attempt for email=${email}`);
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE email = ?", [email]);
            if (rows.length === 0) return res.status(401).json({ message: "User not found" });
            const user = rows[0];
            if (user.is_verified === 'Pending') return res.status(403).json({ message: "Your account is pending admin approval. Please wait for confirmation." });
            if (user.is_verified === 'Rejected') return res.status(403).json({ message: "Your account has been rejected. Please contact the administrator." });
            let match = await bcrypt.compare(password, user.password);
            if (!match && password === user.password) {
              match = true;
              try {
                const newHash = await bcrypt.hash(password, 10);
                await connection.execute("UPDATE residents SET password = ? WHERE id = ?", [newHash, user.id]);
              } catch (migrationErr) {
                console.warn('Could not migrate resident password hash:', migrationErr.message);
              }
            }
            if (!match) return res.status(401).json({ message: "Wrong password" });
            res.json({ user: { id: user.id, full_name: user.full_name, nickname: user.nickname, email: user.email, gender: user.gender, age: user.age, photo: user.photo ? `data:image/jpeg;base64,${user.photo.toString('base64')}` : null } });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM admins WHERE email = ?", [email]);
            if (rows.length === 0) return res.status(401).json({ message: "Admin not found" });
            const admin = rows[0];
            let match = await bcrypt.compare(password, admin.password);
            if (!match && password === admin.password) {
              match = true;
              try {
                const newHash = await bcrypt.hash(password, 10);
                await connection.execute("UPDATE admins SET password = ? WHERE id = ?", [newHash, admin.id]);
              } catch (migrationErr) {
                console.warn('Could not migrate admin password hash:', migrationErr.message);
              }
            }
            if (!match) return res.status(401).json({ message: "Wrong password" });
            res.json({ admin: { id: admin.id, name: admin.name, role: admin.role, email: admin.email } });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- RESIDENT DATA ---

app.get("/api/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE id = ?", [userId]);
            if (rows.length === 0) return res.status(404).json({ message: "User not found" });
            const user = rows[0];
            if (user.photo) user.photo = `data:image/jpeg;base64,${user.photo.toString('base64')}`;
            if (user.id_photo) user.id_photo = `data:image/jpeg;base64,${user.id_photo.toString('base64')}`;
            res.json(user);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/user/:userId", upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'id_photo', maxCount: 1 }]), async (req, res) => {
    try {
        const { userId } = req.params;
        const { full_name, nickname, gender, age, date_of_birth, religion, civil_status, barangay, city_municipality, home_address, mobile_phone, post_grad_course, post_grad_year, college_course, college_year, high_school, high_school_year, elementary, elementary_year, other_education, other_year, emergency_name, emergency_phone, relationship } = req.body;
        const photoData = req.files?.photo?.[0]?.buffer || null;
        const idPhotoData = req.files?.id_photo?.[0]?.buffer || null;
        const connection = await pool.getConnection();
        try {
            // Create a pending update request instead of updating directly
            const [result] = await connection.execute(
                `INSERT INTO profile_update_requests (user_id, full_name, nickname, gender, age, date_of_birth, religion, civil_status, barangay, city_municipality, home_address, mobile_phone, post_grad_course, post_grad_year, college_course, college_year, high_school, high_school_year, elementary, elementary_year, other_education, other_year, emergency_name, emergency_phone, relationship, photo, id_photo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                [userId, full_name || null, nickname || null, gender || null, (age !== undefined && age !== '') ? age : null, (date_of_birth !== undefined && date_of_birth !== '') ? date_of_birth : null, religion || null, civil_status || null, barangay || null, city_municipality || null, home_address || null, mobile_phone || null, post_grad_course || null, post_grad_year || null, college_course || null, college_year || null, high_school || null, high_school_year || null, elementary || null, elementary_year || null, other_education || null, other_year || null, emergency_name || null, emergency_phone || null, relationship || null, photoData, idPhotoData]
            );
            res.json({ message: "Update request submitted for admin approval", requestId: result.insertId });
        } catch (err) { res.status(500).json({ message: "Request submission failed: " + err.message });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN PROFILE UPDATE MANAGEMENT ---

app.get("/api/admin/pending-updates", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                "SELECT pur.*, r.full_name as current_name, r.email as resident_email FROM profile_update_requests pur JOIN residents r ON pur.user_id = r.id WHERE pur.status = 'Pending' ORDER BY pur.created_at ASC"
            );
            const processedRows = rows.map(row => {
              if (row.photo) row.photo = `data:image/jpeg;base64,${row.photo.toString('base64')}`;
              if (row.id_photo) row.id_photo = `data:image/jpeg;base64,${row.id_photo.toString('base64')}`;
              if (row.signature_file) row.signature_file = `data:image/jpeg;base64,${row.signature_file.toString('base64')}`;
              return row;
            });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/approve-update/:requestId", async (req, res) => {
    try {
        const { requestId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM profile_update_requests WHERE id = ?", [requestId]);
            if (rows.length === 0) return res.status(404).json({ message: "Request not found" });
            const update = rows[0];
            
            // Update the resident's profile
            let query = `UPDATE residents SET full_name=?, nickname=?, gender=?, age=?, date_of_birth=?, religion=?, civil_status=?, barangay=?, city_municipality=?, home_address=?, mobile_phone=?, post_grad_course=?, post_grad_year=?, college_course=?, college_year=?, high_school=?, high_school_year=?, elementary=?, elementary_year=?, other_education=?, other_year=?, emergency_name=?, emergency_phone=?, relationship=?`;
            const params = [update.full_name, update.nickname, update.gender, update.age, update.date_of_birth, update.religion, update.civil_status, update.barangay, update.city_municipality, update.home_address, update.mobile_phone, update.post_grad_course, update.post_grad_year, update.college_course, update.college_year, update.high_school, update.high_school_year, update.elementary, update.elementary_year, update.other_education, update.other_year, update.emergency_name, update.emergency_phone, update.relationship];
            
            if (update.photo) { query += `, photo=?`; params.push(update.photo); }
            if (update.id_photo) { query += `, id_photo=?`; params.push(update.id_photo); }
            query += ` WHERE id=?`; params.push(update.user_id);
            
            await connection.execute(query, params);
            await connection.execute("UPDATE profile_update_requests SET status = 'Approved' WHERE id = ?", [requestId]);
            
            res.json({ message: "Update approved and applied" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/reject-update/:requestId", async (req, res) => {
    try {
        const { requestId } = req.params;
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE profile_update_requests SET status = 'Rejected' WHERE id = ?", [requestId]);
            res.json({ message: "Update request rejected" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CERTIFICATE REQUESTS ---

app.post("/api/request-certificate", async (req, res) => {
    try {
        const { user_id, certificate_type, certificate_content } = req.body;
        const connection = await pool.getConnection();
        try {
            const result = await connection.execute("INSERT INTO certificate_requests (user_id, certificate_type, certificate_content) VALUES (?, ?, ?)", [user_id, certificate_type, certificate_content || null]);
            res.json({ message: "Certificate request submitted", requestId: result[0].insertId });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/dashboard/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(`SELECT cr.*, r.full_name, r.email FROM certificate_requests cr JOIN residents r ON cr.user_id = r.id WHERE r.id = ? ORDER BY cr.created_at DESC`, [userId]);
            const processedRows = rows.map(request => {
                let pdfFileStr = null;
                if (request.pdf_file) {
                    if (Buffer.isBuffer(request.pdf_file)) {
                        pdfFileStr = `data:application/pdf;base64,${request.pdf_file.toString('base64')}`;
                    } else {
                        pdfFileStr = request.pdf_file;
                    }
                }
                return {
                    ...request,
                    pdf_file: pdfFileStr
                };
            });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN MANAGEMENT ---

app.get("/api/all-accounts", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE is_verified = 'Approved' AND is_archived = 'No' ORDER BY created_at DESC");
            const processedRows = rows.map(row => {
              if (row.photo) row.photo = `data:image/jpeg;base64,${row.photo.toString('base64')}`;
              if (row.id_photo) row.id_photo = `data:image/jpeg;base64,${row.id_photo.toString('base64')}`;
              if (row.signature_file) row.signature_file = `data:image/jpeg;base64,${row.signature_file.toString('base64')}`;
              return row;
            });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/admin/archived-residents", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE is_archived = 'Yes' ORDER BY archived_at DESC");
            const processedRows = rows.map(row => {
              if (row.photo) row.photo = `data:image/jpeg;base64,${row.photo.toString('base64')}`;
              if (row.id_photo) row.id_photo = `data:image/jpeg;base64,${row.id_photo.toString('base64')}`;
              if (row.signature_file) row.signature_file = `data:image/jpeg;base64,${row.signature_file.toString('base64')}`;
              return row;
            });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/archive-resident/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                "UPDATE residents SET is_archived = 'Yes', archived_at = NOW() WHERE id = ?",
                [userId]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Resident not found" });
            }
            res.json({ message: "Resident account archived successfully" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN REGISTRATION VERIFICATION ---

app.get("/api/admin/pending-registrations", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                "SELECT * FROM residents WHERE is_verified = 'Pending' ORDER BY created_at ASC"
            );
            const processedRows = rows.map(row => {
              if (row.photo) row.photo = `data:image/jpeg;base64,${row.photo.toString('base64')}`;
              if (row.id_photo) row.id_photo = `data:image/jpeg;base64,${row.id_photo.toString('base64')}`;
              if (row.signature_file) row.signature_file = `data:image/jpeg;base64,${row.signature_file.toString('base64')}`;
              return row;
            });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/verify-resident/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE residents SET is_verified = 'Approved' WHERE id = ?", [userId]);
            res.json({ message: "Resident approved successfully" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/verify-all-residents", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE residents SET is_verified = 'Approved' WHERE is_verified = 'Pending'");
            res.json({ message: "All pending residents approved successfully" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/reject-resident/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE residents SET is_verified = 'Rejected' WHERE id = ?", [userId]);
            res.json({ message: "Resident rejected", reason: reason || "No reason provided" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Upload failed: one or more files exceed the 2MB limit.' });
    }
    return res.status(400).json({ message: 'Upload error: ' + err.message });
  }
  next(err);
});

app.get("/api/all-requests", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            console.log(`🔍 [DEBUG] Database: ${pool.pool.config.connectionConfig.database}`);
            console.log("🔍 Admin Dashboard: Fetching all requests...");
            
            const [rows] = await connection.execute("SELECT * FROM certificate_requests ORDER BY id DESC");
            console.log(`✅ RAW DATA FROM DB: Found ${rows.length} rows`);
            if (rows.length > 0) console.log("First row:", JSON.stringify(rows[0]));
            
            // Map the resident details if they exist
            const processedRows = await Promise.all(rows.map(async (request) => {
                const [residents] = await connection.execute("SELECT full_name, email FROM residents WHERE id = ?", [request.user_id]);
                
                let pdfFileStr = null;
                if (request.pdf_file) {
                    pdfFileStr = `data:application/pdf;base64,${request.pdf_file.toString('base64')}`;
                }
                
                return {
                    ...request,
                    pdf_file: pdfFileStr,
                    resident_name: residents.length > 0 ? residents[0].full_name : "Unknown Resident",
                    resident_email: residents.length > 0 ? residents[0].email : "N/A"
                };
            }));
            
            res.json(processedRows || []);
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("❌ Backend Error (all-requests):", err.message);
        res.status(500).json({ message: "Backend error: " + err.message });
    }
});

app.put("/api/request/:id", upload.single('pdf_file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { verification_status, process_status, certificate_content, remove_pdf, visible_to_resident } = req.body;
        const connection = await pool.getConnection();
        try {
            let updateQuery = "UPDATE certificate_requests SET verification_status=?, process_status=?, certificate_content=?, visible_to_resident=?";
            let queryParams = [verification_status, process_status, certificate_content || null, visible_to_resident || 'text'];

            if (req.file) {
                updateQuery += ", pdf_file=?";
                queryParams.push(req.file.buffer);
            } else if (remove_pdf === 'true') {
                updateQuery += ", pdf_file=NULL";
            }
            
            updateQuery += " WHERE id=?";
            queryParams.push(id);

            await connection.execute(updateQuery, queryParams);
            res.json({ message: "Request updated successfully" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/admin/remove-photo/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE residents SET photo = NULL WHERE id = ?", [userId]);
            res.json({ message: "Photo removed successfully" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/admin/delete-resident/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "User ID is required" });
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // Temporarily disable foreign key checks to ensure clean deletion
            await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
            
            // Delete related records
            await connection.execute("DELETE FROM messages WHERE user_id = ?", [userId]);
            await connection.execute("DELETE FROM certificate_requests WHERE user_id = ?", [userId]);
            await connection.execute("DELETE FROM profile_update_requests WHERE user_id = ?", [userId]);
            
            // Finally delete the resident
            const [result] = await connection.execute("DELETE FROM residents WHERE id = ?", [userId]);
            
            // Re-enable foreign key checks
            await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Resident not found" });
            }
            
            await connection.commit();
            res.json({ message: "Resident account and all related data deleted successfully" });
        } catch (err) {
            await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
            await connection.rollback();
            throw err;
        } finally { connection.release(); }
    } catch (err) { 
        console.error("Delete Error:", err);
        res.status(500).json({ message: "Server error: " + err.message }); 
    }
});

app.get("/api/dashboard-stats", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [[row1]] = await connection.execute("SELECT COUNT(*) as total FROM certificate_requests");
            const [[row2]] = await connection.execute("SELECT COUNT(*) as total FROM certificate_requests WHERE verification_status='Verified'");
            const [[row3]] = await connection.execute("SELECT COUNT(*) as total FROM certificate_requests WHERE verification_status='Not Verified'");
            const [[row4]] = await connection.execute("SELECT COUNT(*) as total FROM certificate_requests WHERE verification_status='Not Valid'");
            res.json({ certificates: row1.total, verified: row2.total, not_verified: row3.total, not_valid: row4.total });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CHAT MESSAGES ---

app.post('/api/messages', async (req, res) => {
    try {
        const { user_id, sender, message_text } = req.body;
        if (!user_id || !sender || !message_text) return res.status(400).json({ message: 'Missing fields' });
        const connection = await pool.getConnection();
        try {
            const result = await connection.execute('INSERT INTO messages (user_id, sender, message_text) VALUES (?, ?, ?)', [user_id, sender, message_text]);
            res.json({ message: 'Message sent', messageId: result[0].insertId });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC', [userId]);
            res.json(rows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/conversations', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Get unique residents who have messages, along with their latest message
            const [rows] = await connection.execute(`
                SELECT r.id, r.full_name, r.photo, 
                       (SELECT message_text FROM messages WHERE user_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM messages WHERE user_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                       (SELECT COUNT(*) FROM messages WHERE user_id = r.id AND sender = 'resident' AND is_read = FALSE) as unread_count
                FROM residents r
                WHERE EXISTS (SELECT 1 FROM messages WHERE user_id = r.id)
                ORDER BY last_message_at DESC
            `);
            const processedRows = rows.map(row => { if (row.photo) row.photo = `data:image/jpeg;base64,${row.photo.toString('base64')}`; return row; });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/messages/read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await pool.getConnection();
        try {
            await connection.execute('UPDATE messages SET is_read = TRUE WHERE user_id = ? AND sender = "resident"', [userId]);
            res.json({ message: 'Messages marked as read' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- SETUP ---

app.post('/api/admin/create', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
        const connection = await pool.getConnection();
        try {
            const [existing] = await connection.execute('SELECT id FROM admins WHERE email = ?', [email]);
            if (existing.length > 0) return res.status(409).json({ message: 'Admin account already exists' });
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute('INSERT INTO admins (name, role, email, password) VALUES (?, ?, ?, ?)', [name || 'SYSARCH Admin', role || 'Administrator', email, hashedPassword]);
            res.json({ message: 'Admin account created successfully', email, password });
        } finally { connection.release(); }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/admin/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and new password are required' });
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute('SELECT id FROM admins WHERE email = ?', [email]);
            if (rows.length === 0) return res.status(404).json({ message: 'Admin not found' });
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute('UPDATE admins SET password = ? WHERE email = ?', [hashedPassword, email]);
            res.json({ message: 'Admin password reset successfully', email });
        } finally { connection.release(); }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/api/admin/setup", async (req, res) => {
    try {
        const adminEmail = 'sysarch.admin@local';
        const adminPassword = 'Admin@2026!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM admins WHERE email = ?", [adminEmail]);
            if (rows.length > 0) return res.json({ message: "Admin account already exists" });
            await connection.execute("INSERT INTO admins (name, role, email, password) VALUES (?, ?, ?, ?)", ['SYSARCH Admin', 'Administrator', adminEmail, hashedPassword]);
            res.json({ message: "Admin account created successfully", email: adminEmail, password: adminPassword });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN RESIDENT ARCHIVE FOLDERS ---

app.get("/api/admin/resident-archive-folders", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM resident_archive_folders ORDER BY created_at DESC");
            res.json(rows);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/admin/resident-archive-folders", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Folder name is required' });
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute("INSERT INTO resident_archive_folders (name) VALUES (?)", [name]);
            res.status(201).json({ message: 'Folder created', folderId: result.insertId });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/resident-archive-folders/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Folder name is required' });
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE resident_archive_folders SET name = ? WHERE id = ?", [name, id]);
            res.json({ message: 'Folder renamed successfully' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/resident-archive-folders/move", async (req, res) => {
    try {
        const { residentId, folderId } = req.body;
        if (!residentId) return res.status(400).json({ message: 'Resident ID is required' });
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE residents SET archive_folder_id = ? WHERE id = ?", [folderId || null, residentId]);
            res.json({ message: 'Resident moved to folder successfully' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN DOCUMENT ARCHIVES ---

// Get all folders
app.get("/api/admin/archive-folders", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM archive_folders ORDER BY created_at DESC");
            res.json(rows);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create folder
app.post("/api/admin/archive-folders", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Folder name is required' });
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute("INSERT INTO archive_folders (name) VALUES (?)", [name]);
            res.status(201).json({ message: 'Folder created', folderId: result.insertId });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Rename folder
app.put("/api/admin/archive-folders/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Folder name is required' });
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE archive_folders SET name = ? WHERE id = ?", [name, id]);
            res.json({ message: 'Folder renamed successfully' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get files in a folder (metadata only)
app.get("/api/admin/archive-files/:folderId", async (req, res) => {
    try {
        const { folderId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT id, folder_id, file_name, file_type, file_size, uploaded_by, created_at FROM archive_files WHERE folder_id = ? ORDER BY created_at DESC", [folderId]);
            res.json(rows);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Download a file
app.get("/api/admin/archive-files/download/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT file_name, file_type, file_data FROM archive_files WHERE id = ?", [fileId]);
            if (rows.length === 0) return res.status(404).json({ message: 'File not found' });
            
            const file = rows[0];
            
            res.setHeader('Content-Type', file.file_type);
            res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
            res.send(file.file_data);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upload a file to a folder
app.post("/api/admin/archive-files", upload.single('file'), async (req, res) => {
    try {
        const { folder_id, uploaded_by } = req.body;
        const file = req.file;
        
        if (!folder_id) return res.status(400).json({ message: 'Folder ID is required' });
        if (!file) return res.status(400).json({ message: 'File is required' });
        
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                "INSERT INTO archive_files (folder_id, file_name, file_type, file_size, file_data, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
                [folder_id, file.originalname, file.mimetype, file.size, file.buffer, uploaded_by || 'Admin']
            );
            res.status(201).json({ message: 'File uploaded successfully' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Resident Archive Folders
app.get("/api/admin/resident-archive-folders", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM resident_archive_folders ORDER BY created_at DESC");
            res.json(rows);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/admin/resident-archive-folders", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Folder name is required' });
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute("INSERT INTO resident_archive_folders (name) VALUES (?)", [name]);
            res.status(201).json({ id: result.insertId, name });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/resident-archive-folders/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Folder name is required' });
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE resident_archive_folders SET name = ? WHERE id = ?", [name, id]);
            res.json({ message: 'Folder renamed successfully' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Archived Residents
app.get("/api/admin/archived-residents", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE is_archived = 'Yes' ORDER BY created_at DESC");
            res.json(rows);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/admin/resident/:id/folder", async (req, res) => {
    try {
        const { id } = req.params;
        const { folder_id } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE residents SET archive_folder_id = ? WHERE id = ?", [folder_id, id]);
            res.json({ message: 'Resident moved to folder successfully' });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✓ Server running on port ${PORT} and bound to 0.0.0.0`));
