const express = require('express');
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM experience ORDER BY sort_order').all();
  res.json({ status: 'success', data: items });
});

router.post('/', authMiddleware, (req, res) => {
  const { role, company, timeline, description, sort_order, is_visible } = req.body;
  if (!role || !company || !timeline) return res.status(400).json({ status: 'error', message: 'Role, company, timeline required.' });
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(role, company, timeline, description || '', sort_order || 0, is_visible ?? 1);
  auditLog('create_experience', 'experience', result.lastInsertRowid, req.user.id, req.ip, req.headers['user-agent']);
  res.json({ status: 'success', message: 'Experience created.', data: { id: result.lastInsertRowid } });
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const allowed = ['role', 'company', 'timeline', 'description', 'sort_order', 'is_visible'];
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) { fields.push(`${k} = ?`); values.push(v); }
  }
  if (fields.length === 0) return res.status(400).json({ status: 'error', message: 'No valid fields.' });
  const result = db.prepare(`UPDATE experience SET ${fields.join(', ')} WHERE id = ?`).run(...values, req.params.id);
  if (result.changes === 0) return res.status(404).json({ status: 'error', message: 'Not found.' });
  res.json({ status: 'success', message: 'Experience updated.' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM experience WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ status: 'error', message: 'Not found.' });
  auditLog('delete_experience', 'experience', req.params.id, req.user.id, req.ip, req.headers['user-agent']);
  res.json({ status: 'success', message: 'Experience deleted.' });
});

module.exports = router;
