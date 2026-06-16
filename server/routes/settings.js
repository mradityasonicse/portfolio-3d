const express = require('express');
const { getDb } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();

// GET /api/settings - Public (no auth required)
router.get('/', (req, res) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM portfolio_settings WHERE id = 1').get();
  
  if (!settings) {
    return res.status(404).json({ status: 'error', message: 'Settings not found.' });
  }

  // Also get projects, education, experience for the public site
  const projects = db.prepare('SELECT * FROM projects WHERE is_visible = 1 ORDER BY sort_order').all();
  const education = db.prepare('SELECT * FROM education WHERE is_visible = 1 ORDER BY sort_order').all();
  const experience = db.prepare('SELECT * FROM experience WHERE is_visible = 1 ORDER BY sort_order').all();

  res.json({ status: 'success', settings, projects, education, experience });
});

// POST /api/settings - Auth required, update settings
router.post('/', authMiddleware, (req, res) => {
  const db = getDb();
  const updates = req.body;

  // Build dynamic UPDATE statement from provided fields
  const allowedFields = [
    'theme_preset', 'primary_color', 'secondary_color', 'accent_color',
    'background_color', 'surface_color', 'font_display', 'font_body',
    'animations_enabled', 'layout_sections_order',
    'seo_title', 'seo_description', 'analytics_id',
    'hero_badge', 'hero_title', 'hero_subtitle', 'hero_description',
    'about_lead', 'about_body',
    'skills_web_dev', 'skills_security', 'skills_languages',
    'contact_title', 'contact_subtitle', 'contact_email', 'contact_location', 'contact_status',
    'social_github', 'social_linkedin', 'social_twitter',
    'brand_name', 'logo_text', 'footer_text',
    'goal_1_title', 'goal_1_desc', 'goal_1_status',
    'goal_2_title', 'goal_2_desc', 'goal_2_status',
    'goal_3_title', 'goal_3_desc', 'goal_3_status',
    'custom_css', 'custom_javascript'
  ];

  const fieldsToUpdate = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fieldsToUpdate.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No valid fields to update.' });
  }

  fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
  const sql = `UPDATE portfolio_settings SET ${fieldsToUpdate.join(', ')} WHERE id = 1`;
  
  db.prepare(sql).run(...values);

  auditLog('update_settings', 'settings', 1, req.user.id, req.ip, req.headers['user-agent'], { fields: Object.keys(updates) });

  const updatedSettings = db.prepare('SELECT * FROM portfolio_settings WHERE id = 1').get();
  res.json({ status: 'success', message: 'Settings updated successfully.', settings: updatedSettings });
});

module.exports = router;
