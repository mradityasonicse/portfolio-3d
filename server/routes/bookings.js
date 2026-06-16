const express = require('express');
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/booking-submit - Public
router.post('/', (req, res) => {
  const { name, email, booking_date, booking_time, topic } = req.body;

  if (!name || !email || !booking_date || !booking_time || !topic) {
    return res.status(400).json({ status: 'error', message: 'All fields required.' });
  }

  const db = getDb();
  db.prepare('INSERT INTO bookings (name, email, booking_date, booking_time, topic) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, booking_date, booking_time, topic);

  res.json({ status: 'success', message: 'Booking recorded successfully.' });
});

// GET /api/bookings - Auth required
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);

  res.json({ status: 'success', data: bookings, total, page, limit });
});

// DELETE /api/bookings/:id - Auth required
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ status: 'error', message: 'Booking not found.' });
  }
  res.json({ status: 'success', message: 'Booking deleted.' });
});

module.exports = router;
