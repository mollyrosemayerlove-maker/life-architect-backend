import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple email format validation (RFC 5322 approximation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: "Password must be >= 8 characters" });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
      [email, passwordHash]
    );

    const user = insertResult.rows[0];
    const token = jwt.sign({ user_id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({ success: true, token, user_id: user.id, email: user.email, message: "Signup successful" });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ success: false, error: "Email already exists" });
    }
    console.error("Signup error:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const queryResult = await pool.query(`SELECT id, email, password_hash FROM users WHERE email = $1`, [email]);
    if (queryResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const user = queryResult.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const token = jwt.sign({ user_id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ success: true, token, user_id: user.id, email: user.email });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
