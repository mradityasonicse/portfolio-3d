const { getDb } = require('../db/connection');

function auditLog(action, targetType, targetId, userId, ip, userAgent, details = {}) {
  try {
    const db = getDb();
    db.prepare(`INSERT INTO activity_logs (user_id, action, target_type, target_id, details, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      userId || null,
      action,
      targetType || null,
      targetId || null,
      JSON.stringify(details),
      ip || null,
      userAgent || null
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

function auditMiddleware(req, res, next) {
  // Log will be written after response
  const start = Date.now();
  
  res.on('finish', () => {
    if (req.user && req.method !== 'GET') {
      const action = `${req.method.toLowerCase()}_${req.path.replace('/api/', '').replace(/[^a-z0-9_]/g, '_')}`;
      auditLog(action, null, null, req.user.id, req.ip, req.headers['user-agent']);
    }
  });
  
  next();
}

module.exports = { auditLog, auditMiddleware };
