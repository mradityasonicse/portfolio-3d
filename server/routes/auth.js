const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/connection');
const { authMiddleware, generateAccessToken, generateRefreshToken, JWT_SECRET } = require('../middleware/auth');
const { rateLimitMiddleware, authLimiter } = require('../middleware/rateLimit');
const { auditLog } = require('../middleware/auditLog');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/auth/login
router.post('/login', rateLimitMiddleware(authLimiter), (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password required.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    auditLog('login_failed', 'user', null, null, req.ip, req.headers['user-agent'], { email });
    return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in sessions table
  db.prepare(`INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at) 
              VALUES (?, ?, ?, ?, datetime('now', '+7 days'))`).run(
    user.id, refreshToken, req.ip, req.headers['user-agent']
  );

  // Update last login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  auditLog('login_success', 'user', user.id, user.id, req.ip, req.headers['user-agent']);

  res.json({
    status: 'success',
    message: 'Access Granted',
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, mfa_enabled: user.mfa_enabled }
    }
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ status: 'error', message: 'Refresh token required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ status: 'error', message: 'Invalid refresh token.' });
    }

    const db = getDb();
    const session = db.prepare('SELECT * FROM sessions WHERE refresh_token = ? AND user_id = ?').get(refreshToken, decoded.id);
    
    if (!session) {
      return res.status(401).json({ status: 'error', message: 'Session not found.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found.' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
    db.prepare(`INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at) 
                VALUES (?, ?, ?, ?, datetime('now', '+7 days'))`).run(
      user.id, newRefreshToken, req.ip, req.headers['user-agent']
    );

    res.json({
      status: 'success',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    });
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
  auditLog('logout', 'user', req.user.id, req.user.id, req.ip, req.headers['user-agent']);
  res.json({ status: 'success', message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, role, mfa_enabled, last_login, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found.' });
  }
  res.json({ status: 'success', data: user });
});

// Legacy endpoint: POST /api/login (for backward compat with existing login.html)
router.post('/legacy-login', (req, res) => {
  const { username, password } = req.body;
  
  // Support legacy username/password auth
  if (username === 'aditya' && password === 'soni123') {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@aditya.dev');
    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      db.prepare(`INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at) 
                  VALUES (?, ?, ?, ?, datetime('now', '+7 days'))`).run(
        user.id, refreshToken, req.ip, req.headers['user-agent']
      );

      res.setHeader('Set-Cookie', 'session_id=authorized_aditya_session; Path=/; HttpOnly; SameSite=Lax');
      return res.json({ status: 'success', message: 'Access Granted', data: { accessToken, refreshToken } });
    }
  }
  
  return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  auditLog('password_changed', 'user', req.user.id, null, req.ip, req.headers['user-agent']);
  res.json({ success: true });
});

module.exports = router;
