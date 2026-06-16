const express = require('express');
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// GET /api/media - Auth required
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const typeFilter = req.query.type || '';

  let media;
  let total;
  if (typeFilter) {
    total = db.prepare("SELECT COUNT(*) as count FROM media WHERE mime_type LIKE ?").get(`${typeFilter}%`).count;
    media = db.prepare("SELECT * FROM media WHERE mime_type LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(`${typeFilter}%`, limit, offset);
  } else {
    total = db.prepare('SELECT COUNT(*) as count FROM media').get().count;
    media = db.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  }
  res.json({ status: 'success', data: media, total, page, limit });
});

// POST /api/media/upload - Auth required
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
  }

  const db = getDb();
  const url = `/uploads/${req.file.filename}`;
  const result = db.prepare(
    `INSERT INTO media (filename, original_name, mime_type, size, url, alt_text, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url, '', req.user.id);

  res.json({ status: 'success', message: 'File uploaded.', data: { id: result.lastInsertRowid, url, filename: req.file.filename } });
});

// PUT /api/media/:id - Auth required
router.put('/:id', authMiddleware, (req, res) => {
  const { alt_text } = req.body;
  const db = getDb();
  const result = db.prepare('UPDATE media SET alt_text = ? WHERE id = ?').run(alt_text || '', req.params.id);
  if (result.changes === 0) return res.status(404).json({ status: 'error', message: 'Media not found.' });
  res.json({ status: 'success', message: 'Media updated.' });
});

// DELETE /api/media/:id - Auth required
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const media = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!media) return res.status(404).json({ status: 'error', message: 'Media not found.' });
  
  // Delete file from disk
  const fs = require('fs');
  const filePath = path.join(__dirname, '..', 'uploads', media.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
  res.json({ status: 'success', message: 'Media deleted.' });
});

module.exports = router;
