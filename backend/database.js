const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    console.log("✓ Database tables created/verified!");
    connection.release();
  } catch (err) {
    console.error("✗ Database initialization error:", err.message);
  }
})();

// --- AUTH ROUTES ---

app.post("/api/register", upload.single('photo'), async (req, res) => {
    try {
        const { FullName, Nickname, EmailAddress, Password, DateofBirth, Gender, Age, Religion, CivilStatus, Barangay, 'City/Municipality': CityMunicipality, HomeAddress, MobilePhone, 'Post Graduate Degree/course': PostGraduateCourse, PostGraduateYear, CollegeDegree, CollegeYear, HighSchool, HighSchoolYear, Elementary, ElementaryYear, Others: OtherEducation, OthersYear: OtherYear, EmergencyContactName, EmergencyContactRelation: EmergencyRelation, EmergencyContactPhone: EmergencyPhone } = req.body;
        if (!FullName || !EmailAddress || !Password) return res.status(400).json({ message: "Missing required fields" });
        const hashedPassword = await bcrypt.hash(Password, 10);
        const photoData = req.file ? req.file.buffer : null;
        const connection = await pool.getConnection();
        try {
            const result = await connection.execute(
                `INSERT INTO residents (full_name, nickname, email, password, date_of_birth, age, gender, religion, civil_status, barangay, city_municipality, home_address, mobile_phone, post_grad_course, post_grad_year, college_course, college_year, high_school, high_school_year, elementary, elementary_year, other_education, other_year, emergency_name, emergency_phone, relationship, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [FullName, Nickname || null, EmailAddress, hashedPassword, DateofBirth || null, Age || null, Gender || null, Religion || null, CivilStatus || null, Barangay || null, CityMunicipality || null, HomeAddress || null, MobilePhone || null, PostGraduateCourse || null, PostGraduateYear || null, CollegeDegree || null, CollegeYear || null, HighSchool || null, HighSchoolYear || null, Elementary || null, ElementaryYear || null, OtherEducation || null, OtherYear || null, EmergencyContactName || null, EmergencyPhone || null, EmergencyRelation || null, photoData]
            );
            res.json({ message: "Registered", userId: result[0].insertId });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email already exists" });
            res.status(500).json({ message: "Registration failed: " + err.message });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE email = ?", [email]);
            if (rows.length === 0) return res.status(401).json({ message: "User not found" });
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
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
            const match = await bcrypt.compare(password, admin.password);
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
            res.json(user);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/user/:userId", upload.single('photo'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { full_name, nickname, gender, age, date_of_birth, religion, civil_status, barangay, city_municipality, home_address, mobile_phone, post_grad_course, post_grad_year, college_course, college_year, high_school, high_school_year, elementary, elementary_year, other_education, other_year, emergency_name, emergency_phone, relationship } = req.body;
        const photoData = req.file ? req.file.buffer : null;
        const connection = await pool.getConnection();
        try {
            let query = `UPDATE residents SET full_name=?, nickname=?, gender=?, age=?, date_of_birth=?, religion=?, civil_status=?, barangay=?, city_municipality=?, home_address=?, mobile_phone=?, post_grad_course=?, post_grad_year=?, college_course=?, college_year=?, high_school=?, high_school_year=?, elementary=?, elementary_year=?, other_education=?, other_year=?, emergency_name=?, emergency_phone=?, relationship=?`;
            const params = [full_name || null, nickname || null, gender || null, (age !== undefined && age !== '') ? age : null, (date_of_birth !== undefined && date_of_birth !== '') ? date_of_birth : null, religion || null, civil_status || null, barangay || null, city_municipality || null, home_address || null, mobile_phone || null, post_grad_course || null, post_grad_year || null, college_course || null, college_year || null, high_school || null, high_school_year || null, elementary || null, elementary_year || null, other_education || null, other_year || null, emergency_name || null, emergency_phone || null, relationship || null];
            if (photoData) { query += `, photo=?`; params.push(photoData); }
            query += ` WHERE id=?`; params.push(userId);
            await connection.execute(query, params);
            res.json({ message: "Profile updated successfully" });
        } catch (err) { res.status(500).json({ message: "Database update failed: " + err.message });
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
            res.json(rows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN MANAGEMENT ---

app.get("/api/all-accounts", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT id, full_name, email, gender, age, date_of_birth, photo, created_at FROM residents ORDER BY created_at DESC");
            const processedRows = rows.map(row => { if (row.photo) row.photo = `data:image/jpeg;base64,${row.photo.toString('base64')}`; return row; });
            res.json(processedRows || []);
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
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
                return {
                    ...request,
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

app.put("/api/request/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { verification_status, process_status, certificate_content } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.execute("UPDATE certificate_requests SET verification_status=?, process_status=?, certificate_content=? WHERE id=?", [verification_status, process_status, certificate_content || null, id]);
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

app.post("/api/admin/setup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash("BrgyAdminpassword", 10);
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM admins WHERE email = ?", ["admin@brgy830.com"]);
            if (rows.length > 0) return res.json({ message: "Admin account already exists" });
            await connection.execute("INSERT INTO admins (name, role, email, password) VALUES (?, ?, ?, ?)", ["Brgy830Admin", "Administrator", "admin@brgy830.com", hashedPassword]);
            res.json({ message: "Admin account created successfully" });
        } finally { connection.release(); }
    } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
