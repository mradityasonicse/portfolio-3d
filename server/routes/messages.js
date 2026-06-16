const express = require('express');
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages - Auth required
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let messages;
  let total;
  if (search) {
    total = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE name LIKE ? OR email LIKE ? OR message LIKE ?")
      .get(`%${search}%`, `%${search}%`, `%${search}%`).count;
    messages = db.prepare("SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR message LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(`%${search}%`, `%${search}%`, `%${search}%`, limit, offset);
  } else {
    total = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    messages = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  }

  res.json({ status: 'success', data: messages, total, page, limit });
});

// DELETE /api/messages/:id - Auth required
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ status: 'error', message: 'Message not found.' });
  }
  res.json({ status: 'success', message: 'Message deleted.' });
});

// DELETE /api/messages - Bulk delete
router.delete('/', authMiddleware, (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ status: 'error', message: 'ids array required.' });
  }
  const db = getDb();
  const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
  const deleted = ids.reduce((count, id) => count + stmt.run(id).changes, 0);
  res.json({ status: 'success', message: `${deleted} messages deleted.` });
});

module.exports = router;
