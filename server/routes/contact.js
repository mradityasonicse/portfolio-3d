const express = require('express');
const { getDb } = require('../db/connection');

const router = express.Router();

// POST /api/contact
router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  console.log('Contact form submission received:', { name, email, messageLength: message?.length });

  if (!name || !email || !message) {
    console.error('Contact form validation failed:', { name: !!name, email: !!email, message: !!message });
    return res.status(400).json({ status: 'error', message: 'Name, email, and message are required.' });
  }

  try {
    const db = getDb();
    const result = db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
    console.log('Contact saved to database, ID:', result.lastInsertRowid);
    res.json({ status: 'success', message: 'Message stored successfully.' });
  } catch (error) {
    console.error('Database error saving contact:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to save message. Please try again.' });
  }
});

module.exports = router;
