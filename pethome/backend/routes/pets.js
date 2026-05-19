const express = require('express');
const router = express.Router();
const db = require('../database').getDB();
const PetFactory = require('../PetFactory');
const { PetBuilder } = require('../UserBuilder');
const { verifyToken, isShelter } = require('./middleware');

// =============================================
// GET /api/pets - جيب كل الـ pets (مع filter)
// =============================================
router.get('/', (req, res) => {
  const { type, search, status } = req.query;
  let query = `SELECT pets.*, users.first_name as shelter_name 
               FROM pets LEFT JOIN users ON pets.shelter_id = users.id
               WHERE 1=1`;
  const params = [];

  if (type && type !== 'all') {
    query += ` AND pets.type = ?`;
    params.push(type);
  }
  if (status) {
    query += ` AND pets.status = ?`;
    params.push(status);
  }
  if (search) {
    query += ` AND (pets.name LIKE ? OR pets.breed LIKE ? OR pets.type LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY pets.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// =============================================
// GET /api/pets/:id - جيب pet بالـ id
// =============================================
router.get('/:id', (req, res) => {
  db.get(
    `SELECT pets.*, users.first_name as shelter_name, users.phone as shelter_phone
     FROM pets LEFT JOIN users ON pets.shelter_id = users.id
     WHERE pets.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Pet not found' });
      res.json(row);
    }
  );
});

// =============================================
// POST /api/pets - أضف pet جديد (shelter only)
// =============================================
router.post('/', verifyToken, isShelter, (req, res) => {
  try {
    // Factory Pattern - بنعمل الـ pet object حسب الـ type
    const petData = PetFactory.createPet(req.body.type, {
      ...req.body,
      shelter_id: req.user.id
    });

    // Builder Pattern - بنبني الـ pet للـ database
    const pet = new PetBuilder()
      .setName(petData.name)
      .setType(petData.type)
      .setBreed(petData.breed)
      .setGender(petData.gender)
      .setAge(petData.age)
      .setHealth(petData.health_status)
      .setDescription(petData.description)
      .setLocation(petData.location)
      .setShelter(petData.shelter_id)
      .build();

    db.run(
      `INSERT INTO pets (name, type, breed, gender, age, health_status, description, location, shelter_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet.name, pet.type, pet.breed, pet.gender, pet.age, pet.health_status, pet.description, pet.location, pet.shelter_id, pet.status],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Pet added successfully', id: this.lastID });
      }
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// =============================================
// PUT /api/pets/:id - عدل pet (shelter only)
// =============================================
router.put('/:id', verifyToken, isShelter, (req, res) => {
  const { name, breed, age, health_status, description, status } = req.body;

  db.run(
    `UPDATE pets SET name=?, breed=?, age=?, health_status=?, description=?, status=?
     WHERE id=? AND shelter_id=?`,
    [name, breed, age, health_status, description, status, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Pet not found or unauthorized' });
      res.json({ message: 'Pet updated successfully' });
    }
  );
});

// =============================================
// DELETE /api/pets/:id - امسح pet (shelter only)
// =============================================
router.delete('/:id', verifyToken, isShelter, (req, res) => {
  db.run(
    `DELETE FROM pets WHERE id = ? AND shelter_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Pet not found or unauthorized' });
      res.json({ message: 'Pet deleted successfully' });
    }
  );
});

module.exports = router;