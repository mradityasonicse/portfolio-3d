const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// All admin routes require authentication
router.use(authMiddleware);

/* ── Dashboard stats ── */
router.get('/stats', (req, res) => {
  const db = getDb();
  try {
    const stats = {
      projects:   db.prepare('SELECT COUNT(*) as c FROM projects').get().c,
      education:  db.prepare('SELECT COUNT(*) as c FROM education').get().c,
      experience: db.prepare('SELECT COUNT(*) as c FROM experience').get().c,
      messages:   db.prepare('SELECT COUNT(*) as c FROM contacts').get().c,
      bookings:   db.prepare('SELECT COUNT(*) as c FROM bookings').get().c,
      media:      db.prepare('SELECT COUNT(*) as c FROM media').get().c,
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── Activity log ── */
router.get('/activity', (req, res) => {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  try {
    const logs = db.prepare(
      'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?'
    ).all(limit);
    res.json({ logs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DB Query terminal ── */
router.post('/db-query', (req, res) => {
  const db = getDb();
  const { query } = req.body;
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query required' });

  // Safety: log destructive queries
  const upper = query.trim().toUpperCase();
  const destructive = upper.startsWith('DROP') || upper.startsWith('TRUNCATE') || upper.startsWith('ALTER');
  if (destructive) {
    // Allow but log with warning
    db.prepare(
      "INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)"
    ).run(req.user?.id, `DESTRUCTIVE_QUERY: ${query.slice(0, 100)}`, req.ip);
  }

  const start = Date.now();
  try {
    const isSelect = upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.startsWith('EXPLAIN');
    if (isSelect) {
      const stmt = db.prepare(query);
      const rows = stmt.all();
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      res.json({ rows, columns, rowCount: rows.length, duration: Date.now() - start });
    } else {
      const result = db.prepare(query).run();
      res.json({ rows: [], columns: [], rowCount: 0, changes: result.changes, duration: Date.now() - start });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* ── Sessions ── */
router.get('/sessions', (req, res) => {
  const db = getDb();
  try {
    const sessions = db.prepare(
      'SELECT id, ip_address, created_at, expires_at FROM sessions WHERE user_id = ? AND expires_at > ?'
    ).all(req.user.id, new Date().toISOString());
    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/sessions/:id', (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── Backups ── */
router.get('/backups', (req, res) => {
  const db = getDb();
  try {
    const backups = db.prepare('SELECT * FROM backups ORDER BY created_at DESC').all();
    res.json({ backups });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/backups', (req, res) => {
  const db = getDb();
  try {
    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `portfolio-backup-${timestamp}.db`;
    const destPath = path.join(backupsDir, filename);

    // SQLite online backup via file copy (safe with WAL mode checkpoint)
    db.pragma('wal_checkpoint(FULL)');
    const dbPath = path.join(__dirname, '../../portfolio.db');
    fs.copyFileSync(dbPath, destPath);

    const stat = fs.statSync(destPath);
    const backup = {
      id: uuidv4(),
      filename,
      path: destPath,
      size: stat.size,
      created_at: new Date().toISOString(),
    };

    db.prepare(
      'INSERT INTO backups (id, filename, path, size, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(backup.id, backup.filename, backup.path, backup.size, backup.created_at);

    res.json({ backup });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/backups/:id/download', (req, res) => {
  const db = getDb();
  try {
    const backup = db.prepare('SELECT * FROM backups WHERE id = ?').get(req.params.id);
    if (!backup) return res.status(404).json({ error: 'Not found' });
    if (!fs.existsSync(backup.path)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(backup.path, backup.filename);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── API Keys ── */
router.get('/api-keys', (req, res) => {
  const db = getDb();
  try {
    // Return keys with masked values (only show full key once at creation)
    const keys = db.prepare('SELECT id, name, permissions, created_at FROM api_keys ORDER BY created_at DESC').all();
    res.json({ keys });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/api-keys', (req, res) => {
  const db = getDb();
  const { name, permissions = 'read' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const rawKey = `ak_${uuidv4().replace(/-/g, '')}`;
    const id = uuidv4();
    db.prepare(
      'INSERT INTO api_keys (id, name, key, permissions, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, rawKey, permissions, new Date().toISOString());
    // Return full key only once
    res.json({ key: { id, name, key: rawKey, permissions, created_at: new Date().toISOString() } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/api-keys/:id', (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
