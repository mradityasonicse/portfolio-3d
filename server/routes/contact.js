const express = require('express');
const { getDb } = require('../db/connection');

const router = express.Router();

// POST /api/contact
router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Name, email, and message are required.' });
  }

  const db = getDb();
  db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)').run(name, email, message);

  res.json({ status: 'success', message: 'Message stored successfully.' });
});

module.exports = router;
