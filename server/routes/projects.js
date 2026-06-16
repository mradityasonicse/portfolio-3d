const express = require('express');
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();

// GET /api/projects
router.get('/', (req, res) => {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order').all();
  res.json({ status: 'success', data: projects });
});

// POST /api/projects - Auth required
router.post('/', authMiddleware, (req, res) => {
  const { title, description, image_url, github_link, live_link, tags, sort_order, is_visible } = req.body;
  if (!title || !description) {
    return res.status(400).json({ status: 'error', message: 'Title and description required.' });
  }
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO projects (title, description, image_url, github_link, live_link, tags, sort_order, is_visible) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title, description, image_url || '', github_link || '', live_link || '', tags || '', sort_order || 0, is_visible ?? 1);

  auditLog('create_project', 'project', result.lastInsertRowid, req.user.id, req.ip, req.headers['user-agent']);
  res.json({ status: 'success', message: 'Project created.', data: { id: result.lastInsertRowid } });
});

// PUT /api/projects/:id - Auth required
router.put('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const allowed = ['title', 'description', 'image_url', 'github_link', 'live_link', 'tags', 'sort_order', 'is_visible'];
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) { fields.push(`${k} = ?`); values.push(v); }
  }
  if (fields.length === 0) return res.status(400).json({ status: 'error', message: 'No valid fields.' });
  const result = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values, req.params.id);
  if (result.changes === 0) return res.status(404).json({ status: 'error', message: 'Project not found.' });
  res.json({ status: 'success', message: 'Project updated.' });
});

// DELETE /api/projects/:id - Auth required
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ status: 'error', message: 'Project not found.' });
  auditLog('delete_project', 'project', req.params.id, req.user.id, req.ip, req.headers['user-agent']);
  res.json({ status: 'success', message: 'Project deleted.' });
});

module.exports = router;
