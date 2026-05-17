const express = require('express');
const router = express.Router();
const db = require('../database').getDB();
const { notificationService } = require('../NotificationObserver');
const { verifyToken, isShelter, isAdopter } = require('./middleware');

// =============================================
// POST /api/requests - ابعت adoption request
// =============================================
router.post('/', verifyToken, isAdopter, (req, res) => {
  const { pet_id, message } = req.body;
  const adopter_id = req.user.id;

  // تأكد إن الـ pet موجودة وـ available
  db.get(`SELECT pets.*, users.id as shelter_user_id, users.first_name as shelter_name
          FROM pets LEFT JOIN users ON pets.shelter_id = users.id
          WHERE pets.id = ?`, [pet_id], async (err, pet) => {

    if (err || !pet) return res.status(404).json({ error: 'Pet not found' });
    if (pet.status !== 'available') return res.status(400).json({ error: 'Pet is not available for adoption' });

    // تأكد مش بعتش request قبل كده لنفس الـ pet
    db.get(`SELECT id FROM adoption_requests WHERE pet_id = ? AND adopter_id = ? AND status = 'pending'`,
      [pet_id, adopter_id], async (err, existing) => {
        if (existing) return res.status(400).json({ error: 'You already have a pending request for this pet' });

        // احفظ الـ request
        db.run(
          `INSERT INTO adoption_requests (pet_id, adopter_id, message) VALUES (?, ?, ?)`,
          [pet_id, adopter_id, message || ''],
          async function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // جيب اسم الـ adopter
            db.get(`SELECT first_name, last_name FROM users WHERE id = ?`, [adopter_id], async (err, adopter) => {
              // Observer Pattern - ابعت notification للـ shelter
              await notificationService.notify('REQUEST_SUBMITTED', {
                shelter_id: pet.shelter_user_id,
                pet_name: pet.name,
                adopter_name: `${adopter.first_name} ${adopter.last_name}`
              });
            });

            res.status(201).json({ message: 'Adoption request sent successfully!', id: this.lastID });
          }
        );
      });
  });
});

// =============================================
// GET /api/requests - جيب الـ requests
// =============================================
router.get('/', verifyToken, (req, res) => {
  let query, params;

  if (req.user.role === 'adopter') {
    // الـ adopter يشوف requests بتوعه
    query = `SELECT ar.*, p.name as pet_name, p.type as pet_type
             FROM adoption_requests ar
             JOIN pets p ON ar.pet_id = p.id
             WHERE ar.adopter_id = ?
             ORDER BY ar.created_at DESC`;
    params = [req.user.id];
  } else {
    // الـ shelter يشوف requests على الـ pets بتوعه
    query = `SELECT ar.*, p.name as pet_name, p.type as pet_type,
             u.first_name as adopter_name, u.email as adopter_email, u.phone as adopter_phone
             FROM adoption_requests ar
             JOIN pets p ON ar.pet_id = p.id
             JOIN users u ON ar.adopter_id = u.id
             WHERE p.shelter_id = ?
             ORDER BY ar.created_at DESC`;
    params = [req.user.id];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// =============================================
// PUT /api/requests/:id - approve أو reject
// =============================================
router.put('/:id', verifyToken, isShelter, (req, res) => {
  const { status } = req.body; // 'approved' أو 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  // جيب بيانات الـ request
  db.get(
    `SELECT ar.*, p.name as pet_name, p.shelter_id, u.first_name as adopter_name
     FROM adoption_requests ar
     JOIN pets p ON ar.pet_id = p.id
     JOIN users u ON ar.adopter_id = u.id
     WHERE ar.id = ?`,
    [req.params.id],
    async (err, request) => {
      if (err || !request) return res.status(404).json({ error: 'Request not found' });
      if (request.shelter_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

      // عدل الـ status
      db.run(
        `UPDATE adoption_requests SET status = ? WHERE id = ?`,
        [status, req.params.id],
        async function (err) {
          if (err) return res.status(500).json({ error: err.message });

          // لو اتقبل، غير الـ pet status لـ adopted
          if (status === 'approved') {
            db.run(`UPDATE pets SET status = 'adopted' WHERE id = ?`, [request.pet_id]);
            // ارفض باقي الـ requests على نفس الـ pet
            db.run(`UPDATE adoption_requests SET status = 'rejected' WHERE pet_id = ? AND id != ?`,
              [request.pet_id, req.params.id]);
          }

          // Observer Pattern - ابعت notification للـ adopter
          const event = status === 'approved' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED';
          await notificationService.notify(event, {
            adopter_id: request.adopter_id,
            pet_name: request.pet_name
          });

          res.json({ message: `Request ${status} successfully` });
        }
      );
    }
  );
});

module.exports = router;