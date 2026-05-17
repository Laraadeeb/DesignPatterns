const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../database').getDB();
const PetFactory = require('../PetFactory');
const { PetBuilder } = require('../UserBuilder');
const { verifyToken, isShelter } = require('./middleware');

// =============================================
// Multer config - حفظ الصور في uploads/
// =============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'pet-' + unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// =============================================
// GET /api/pets
// =============================================
router.get('/', (req, res) => {
  const { type, search, status } = req.query;
  let query = `SELECT pets.*, users.first_name as shelter_name 
               FROM pets LEFT JOIN users ON pets.shelter_id = users.id
               WHERE 1=1`;
  const params = [];

  if (type && type !== 'all') { query += ` AND pets.type = ?`; params.push(type); }
  if (status) { query += ` AND pets.status = ?`; params.push(status); }
  if (search) { query += ` AND (pets.name LIKE ? OR pets.breed LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  query += ` ORDER BY pets.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// =============================================
// GET /api/pets/:id
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
// POST /api/pets - مع صورة اختيارية
// =============================================
router.post('/', verifyToken, isShelter, upload.single('image'), (req, res) => {
  try {
    const imageUrl = req.file ? '/uploads/' + req.file.filename : null;

    const petData = PetFactory.createPet(req.body.type, {
      ...req.body,
      shelter_id: req.user.id
    });

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
      `INSERT INTO pets (name, type, breed, gender, age, health_status, description, location, shelter_id, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pet.name, pet.type, pet.breed, pet.gender, pet.age, pet.health_status,
       pet.description, pet.location, pet.shelter_id, pet.status, imageUrl],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Pet added successfully', id: this.lastID, image_url: imageUrl });
      }
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// =============================================
// PUT /api/pets/:id
// Dynamic update - بيبني الـ query من الـ fields اللي اتبعتت بس
// يعني updateStatus بيبعت { status } بس من غير ما يمسح باقي البيانات
// =============================================
router.put('/:id', verifyToken, isShelter, upload.single('image'), (req, res) => {
  const allowed = ['name', 'breed', 'age', 'health_status', 'description', 'status', 'location', 'gender'];
  const fields = [];
  const values = [];

  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      fields.push(field + ' = ?');
      values.push(req.body[field]);
    }
  });

  if (req.file) {
    fields.push('image_url = ?');
    values.push('/uploads/' + req.file.filename);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id, req.user.id);

  db.run(
    'UPDATE pets SET ' + fields.join(', ') + ' WHERE id = ? AND shelter_id = ?',
    values,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Pet not found or unauthorized' });
      res.json({ message: 'Pet updated successfully' });
    }
  );
});

// =============================================
// DELETE /api/pets/:id
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