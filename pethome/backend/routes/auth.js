const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database').getDB();
const { UserBuilder } = require('../UserBuilder');

const JWT_SECRET = 'pethome_secret_2025'; // في الـ production هيبقى في .env

// =============================================
// POST /api/auth/register
// =============================================
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, role } = req.body;

    // Check if email already exists
    db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, row) => {
      if (row) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Builder Pattern - بنبني الـ user object
      const user = new UserBuilder()
        .setName(first_name, last_name)
        .setEmail(email)
        .setPassword(hashedPassword)
        .setPhone(phone || '')
        .setRole(role || 'adopter')
        .build();

      // Save to database
      db.run(
        `INSERT INTO users (first_name, last_name, email, password, phone, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.first_name, user.last_name, user.email, user.password, user.phone, user.role],
        function (err) {
          if (err) return res.status(500).json({ error: 'Registration failed' });

          const token = jwt.sign(
            { id: this.lastID, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: this.lastID, first_name, last_name, email, role: user.role }
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// POST /api/auth/login
// =============================================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role }
    });
  });
});

module.exports = router;