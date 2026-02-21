import express from "express";
import mysql from "mysql2";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();
const SECRET = "your_jwt_secret_key";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "raahul@185",
  database: "user_db",
});

// ✅ Signup route can stay if using authController
// router.post("/signup", signup);

// 🔐 Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("🟢 Login attempt received:", req.body);

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const student = results[0];

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ id: student.id, email: student.email }, SECRET, { expiresIn: "1h" });

    console.log("🎟️ JWT token created for:", student.email);

    res.json({ success: true, token, student });
  });
});

export default router;
