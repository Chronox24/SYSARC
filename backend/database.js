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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS certificate_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        certificate_type VARCHAR(255) NOT NULL,
        verification_status VARCHAR(50) DEFAULT 'Not Verified',
        process_status VARCHAR(50) DEFAULT 'In process',
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
            CREATE TABLE IF NOT EXISTS resident_questions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                name VARCHAR(255),
                email VARCHAR(255),
                question_text TEXT,
                answer_text TEXT,
                status VARCHAR(50) DEFAULT 'unanswered',
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


app.post("/api/register", upload.single('photo'), async (req, res) => {
    try {
        console.log("📝 Registration request received for:", req.body.EmailAddress);
        
        const {
            FullName,
            Nickname,
            EmailAddress,
            Password,
            DateofBirth,
            Gender,
            Age,
            Religion,
            CivilStatus,
            Barangay,
            'City/Municipality': CityMunicipality,
            HomeAddress,
            MobilePhone,
            'Post Graduate Degree/course': PostGraduateCourse,
            PostGraduateYear,
            CollegeDegree,
            CollegeYear,
            HighSchool,
            HighSchoolYear,
            Elementary,
            ElementaryYear,
            Others: OtherEducation,
            OthersYear: OtherYear,
            EmergencyContactName,
            EmergencyContactRelation: EmergencyRelation,
            EmergencyContactPhone: EmergencyPhone
        } = req.body;
        
        if (!FullName || !EmailAddress || !Password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const hashedPassword = await bcrypt.hash(Password, 10);
        
        const connection = await pool.getConnection();
        try {
            console.log("🔄 Inserting user into database...");
            const result = await connection.execute(
                `INSERT INTO residents (
                    full_name, nickname, email, password, date_of_birth, age, gender,
                    religion, civil_status, barangay, city_municipality, home_address,
                    mobile_phone, post_grad_course, post_grad_year, college_course,
                    college_year, high_school, high_school_year, elementary,
                    elementary_year, other_education, other_year, emergency_name, emergency_phone,
                    relationship
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    FullName,
                    Nickname || null,
                    EmailAddress,
                    hashedPassword,
                    DateofBirth || null,
                    Age || null,
                    Gender || null,
                    Religion || null,
                    CivilStatus || null,
                    Barangay || null,
                    CityMunicipality || null,
                    HomeAddress || null,
                    MobilePhone || null,
                    PostGraduateCourse || null,
                    PostGraduateYear || null,
                    CollegeDegree || null,
                    CollegeYear || null,
                    HighSchool || null,
                    HighSchoolYear || null,
                    Elementary || null,
                    ElementaryYear || null,
                    OtherEducation || null,
                    OtherYear || null,
                    EmergencyContactName || null,
                    EmergencyPhone || null,
                    EmergencyRelation || null
                ]
            );
            
            console.log("✓ User registered successfully with ID:", result[0].insertId);
            res.json({ message: "Registered", userId: result[0].insertId });
        } catch (err) {
            console.error("✗ Registration error:", err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Email already exists" });
            }
            return res.status(500).json({ message: err.message });
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("✗ Request error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE email = ?", [email]);
            
            if (rows.length === 0) {
                return res.status(401).json({ message: "User not found" });
            }

            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (!match) {
                return res.status(401).json({ message: "Wrong password" });
            }

            res.json({
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    nickname: user.nickname,
                    email: user.email,
                    gender: user.gender,
                    age: user.age
                }
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM admins WHERE email = ?", [email]);
            
            if (rows.length === 0) {
                return res.status(401).json({ message: "Admin not found" });
            }

            const admin = rows[0];
            const match = await bcrypt.compare(password, admin.password);
            
            if (!match) {
                return res.status(401).json({ message: "Wrong password" });
            }

            res.json({
                admin: {
                    id: admin.id,
                    name: admin.name,
                    role: admin.role,
                    email: admin.email
                }
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/api/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT * FROM residents WHERE id = ?", [userId]);
            
            if (rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json(rows[0]);
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put("/api/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("📝 Update profile request for user:", userId);
        
        const {
            full_name,
            nickname,
            gender,
            age,
            date_of_birth,
            religion,
            civil_status,
            barangay,
            city_municipality,
            home_address,
            mobile_phone,
            post_grad_course,
            post_grad_year,
            college_course,
            college_year,
            high_school,
            high_school_year,
            elementary,
            elementary_year,
            other_education,
            other_year,
            emergency_name,
            emergency_phone,
            relationship
        } = req.body;

        const connection = await pool.getConnection();
        try {
            console.log("🔄 Updating user in database...");
            await connection.execute(
                `UPDATE residents SET 
                    full_name=?, nickname=?, gender=?, age=?, date_of_birth=?,
                    religion=?, civil_status=?, barangay=?, city_municipality=?,
                    home_address=?, mobile_phone=?, post_grad_course=?, post_grad_year=?,
                    college_course=?, college_year=?, high_school=?, high_school_year=?,
                    elementary=?, elementary_year=?, other_education=?, other_year=?,
                    emergency_name=?, emergency_phone=?, relationship=?
                WHERE id=?`,
                [
                    full_name || null,
                    nickname || null,
                    gender || null,
                    age || null,
                    date_of_birth || null,
                    religion || null,
                    civil_status || null,
                    barangay || null,
                    city_municipality || null,
                    home_address || null,
                    mobile_phone || null,
                    post_grad_course || null,
                    post_grad_year || null,
                    college_course || null,
                    college_year || null,
                    high_school || null,
                    high_school_year || null,
                    elementary || null,
                    elementary_year || null,
                    other_education || null,
                    other_year || null,
                    emergency_name || null,
                    emergency_phone || null,
                    relationship || null,
                    userId
                ]
            );
            
            console.log("✓ Profile updated successfully");
            res.json({ message: "Profile updated successfully" });
        } catch (err) {
            console.error("✗ Database update error:", err.message);
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("✗ Update profile error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

app.get("/api/all-accounts", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute("SELECT id, full_name, email, gender, age, created_at FROM residents ORDER BY created_at DESC");
            res.json(rows || []);
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete("/api/delete-all-accounts", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.execute("DELETE FROM residents");
            res.json({ message: "All accounts deleted successfully" });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/api/delete-all-accounts", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.execute("DELETE FROM residents");
            res.json({ message: "All accounts deleted successfully" });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/api/request-certificate", async (req, res) => {
    try {
        const { user_id, certificate_type } = req.body;

        const connection = await pool.getConnection();
        try {
            const result = await connection.execute(
                "INSERT INTO certificate_requests (user_id, certificate_type) VALUES (?, ?)",
                [user_id, certificate_type]
            );
            res.json({ message: "Certificate request submitted", requestId: result[0].insertId });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/question', async (req, res) => {
    try {
        const { user_id, name, email, question_text } = req.body;
        if (!question_text) return res.status(400).json({ message: 'Question text required' });
        if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
        if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });
     
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email' });

        const connection = await pool.getConnection();
        try {
            const result = await connection.execute(
                'INSERT INTO resident_questions (user_id, name, email, question_text) VALUES (?, ?, ?, ?)',
                [user_id || null, name || null, email || null, question_text]
            );
            res.json({ message: 'Question submitted', questionId: result[0].insertId });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.get('/api/questions', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT q.id, q.user_id, q.name, q.email, q.question_text, q.answer_text, q.status, q.created_at, r.full_name
                 FROM resident_questions q
                 LEFT JOIN residents r ON q.user_id = r.id
                 ORDER BY q.created_at DESC`
            );
            res.json(rows || []);
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.put('/api/question/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { answer_text, status } = req.body;
        const connection = await pool.getConnection();
        try {
            await connection.execute('UPDATE resident_questions SET answer_text = ?, status = ? WHERE id = ?', [answer_text || null, status || 'answered', id]);
            res.json({ message: 'Question updated' });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get("/api/dashboard/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT
                    cr.id,
                    cr.request_date,
                    cr.certificate_type,
                    r.full_name,
                    r.email,
                    cr.verification_status,
                    cr.process_status
                FROM certificate_requests cr
                JOIN residents r ON cr.user_id = r.id
                WHERE r.id = ?
                ORDER BY cr.created_at DESC`,
                [userId]
            );
            res.json(rows || []);
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
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
            
            res.json({
                certificates: row1.total,
                verified: row2.total,
                not_verified: row3.total,
                not_valid: row4.total
            });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put("/api/verify/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { verification_status, process_status } = req.body;

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                "UPDATE certificate_requests SET verification_status=?, process_status=? WHERE id=?",
                [verification_status, process_status, id]
            );
            res.json({ message: "Status updated" });
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/api/admin/setup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash("BrgyAdminpassword", 10);
        
        const connection = await pool.getConnection();
        try {
            
            const [rows] = await connection.execute("SELECT * FROM admins WHERE email = ?", ["admin@brgy830.com"]);
            
            if (rows.length > 0) {
                return res.json({ message: "Admin account already exists" });
            }
            
            
            await connection.execute(
                "INSERT INTO admins (name, role, email, password) VALUES (?, ?, ?, ?)",
                ["Brgy830Admin", "Administrator", "admin@brgy830.com", hashedPassword]
            );
            
            console.log("✓ Admin account created successfully");
            res.json({ message: "Admin account created successfully" });
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("✗ Admin setup error:", err.message);
        res.status(500).json({ message: err.message });
    }
});


const PORT = 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);
