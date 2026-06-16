const { getDb } = require('./connection');
const bcrypt = require('bcryptjs');

function initializeDatabase() {
  const db = getDb();

  // ---- Existing tables (preserved from Java server) ----
  db.exec(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    topic TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS portfolio_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme_preset TEXT DEFAULT 'dark',
    primary_color TEXT DEFAULT '#f43f5e',
    secondary_color TEXT DEFAULT '#8b5cf6',
    accent_color TEXT DEFAULT '#f59e0b',
    background_color TEXT DEFAULT '#050811',
    surface_color TEXT DEFAULT '#0c1122',
    font_display TEXT DEFAULT 'Oswald',
    font_body TEXT DEFAULT 'Inter',
    animations_enabled INTEGER DEFAULT 1,
    layout_sections_order TEXT DEFAULT 'about,education,skills,now,projects,contact',
    seo_title TEXT DEFAULT 'Aditya Soni | Developer & Security Enthusiast',
    seo_description TEXT DEFAULT 'B.Tech CSE Undergrad at Rungta Skill University. Full-stack developer & ethical hacker.',
    analytics_id TEXT DEFAULT '',
    hero_badge TEXT DEFAULT 'First-year CSE student · Bhilai, CG',
    hero_title TEXT DEFAULT 'I BUILD WEB THINGS.\nTHEN I TRY TO\nBREAK THEM.',
    hero_subtitle TEXT DEFAULT '— Aditya Soni',
    hero_description TEXT DEFAULT 'I''m a CS undergrad at Rungta University, Bhilai who spends most of his time writing MERN stack apps and then poking holes in them on Kali Linux.',
    about_lead TEXT DEFAULT 'A first-year CS undergrad trying to bridge the gap between building things and breaking them.',
    about_body TEXT DEFAULT 'I''m Aditya Soni, a Computer Science student currently in my first year at Rungta International Skill University, Bhilai.',
    skills_web_dev TEXT DEFAULT 'MongoDB, Express.js, React.js, Node.js, REST APIs',
    skills_security TEXT DEFAULT 'Kali Linux, Nmap, Wireshark, Metasploit, Pen Testing',
    skills_languages TEXT DEFAULT 'C / C++, HTML5 / CSS3, JavaScript, Git & GitHub',
    contact_title TEXT DEFAULT 'LET''S COLLABORATE ON THE FUTURE',
    contact_subtitle TEXT DEFAULT 'Have a project in mind, need a security audit, or just want to chat about CS?',
    social_github TEXT DEFAULT 'https://github.com',
    social_linkedin TEXT DEFAULT 'https://linkedin.com',
    social_twitter TEXT DEFAULT 'https://twitter.com',
    brand_name TEXT DEFAULT 'Aditya Soni',
    logo_text TEXT DEFAULT 'ADITYA.DEV',
    footer_text TEXT DEFAULT '© 2026 Aditya Soni. All Rights Reserved.',
    goal_1_title TEXT DEFAULT 'Goal #1',
    goal_1_desc TEXT DEFAULT 'Master Cybersecurity.',
    goal_1_status TEXT DEFAULT 'Priority',
    goal_2_title TEXT DEFAULT 'Goal #2',
    goal_2_desc TEXT DEFAULT 'Become a MERN Developer.',
    goal_2_status TEXT DEFAULT 'In Progress',
    goal_3_title TEXT DEFAULT 'Goal #3',
    goal_3_desc TEXT DEFAULT 'Serve the Nation.',
    goal_3_status TEXT DEFAULT 'The Why',
    contact_email TEXT DEFAULT 'mradityasoni.cse@gmail.com',
    contact_location TEXT DEFAULT 'Bhilai, Chhattisgarh',
    contact_status TEXT DEFAULT 'Open to Opportunities',
    custom_css TEXT DEFAULT '',
    custom_javascript TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    github_link TEXT DEFAULT '',
    live_link TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    timeline TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    timeline TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // ---- New tables for admin panel ----
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    mfa_secret TEXT DEFAULT '',
    mfa_enabled INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    refresh_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id TEXT DEFAULT 'index',
    type TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    content_json TEXT DEFAULT '{}',
    enabled INTEGER DEFAULT 1,
    locked INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_title TEXT DEFAULT '',
    meta_description TEXT DEFAULT '',
    seo_schema_json TEXT DEFAULT '{}',
    template TEXT DEFAULT 'default',
    published INTEGER DEFAULT 1,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER,
    url TEXT NOT NULL,
    alt_text TEXT DEFAULT '',
    uploaded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service TEXT NOT NULL,
    key_value TEXT NOT NULL,
    permissions TEXT DEFAULT 'read',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    restored_at TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page TEXT NOT NULL,
    referrer TEXT DEFAULT '',
    ip_hash TEXT,
    user_agent TEXT,
    device_type TEXT DEFAULT 'desktop',
    country TEXT DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS component_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    html_template TEXT NOT NULL,
    css_template TEXT DEFAULT '',
    js_template TEXT DEFAULT '',
    props_schema TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // ---- Seed default data ----
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM portfolio_settings').get();
  if (settingsCount.count === 0) {
    db.prepare('INSERT INTO portfolio_settings (id) VALUES (1)').run();
    console.log('DB: Seeded portfolio_settings with defaults');
  }

  const projectsCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  if (projectsCount.count === 0) {
    db.prepare(`INSERT INTO projects (title, description, tags, sort_order, is_visible) VALUES (?, ?, ?, ?, ?)`).run(
      'This Portfolio',
      'The site you\'re looking at. Built with vanilla HTML/CSS/JS, GSAP animations, Tailwind, and a Node.js backend with SQLite.',
      'HTML/CSS/JS,GSAP,Node.js,SQLite', 0, 1
    );
    console.log('DB: Seeded projects with default');
  }

  const eduCount = db.prepare('SELECT COUNT(*) as count FROM education').get();
  if (eduCount.count === 0) {
    db.prepare(`INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'B.Tech - Computer Science Engineering', 'Rungta International Skill University, Bhilai', '2026 - Present',
      'Learning data structures, algorithms, and computer networks.', 0, 1
    );
    db.prepare(`INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Higher Secondary (Class XII)', 'Board Examinations • CBSE', '2026 Batch',
      'Completed Senior Secondary with Mathematics, Physics, Chemistry, and Computer Science. 80% marks.', 1, 1
    );
    db.prepare(`INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Secondary School (Class X)', 'Board Examinations • CBSE', '2024 Batch',
      'Achieved 92% marks.', 2, 1
    );
    console.log('DB: Seeded education with defaults');
  }

  const expCount = db.prepare('SELECT COUNT(*) as count FROM experience').get();
  if (expCount.count === 0) {
    db.prepare(`INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Learning MERN Stack', 'Self-study', 'Currently',
      'Building full-stack apps with MongoDB, Express, React, and Node.', 0, 1
    );
    db.prepare(`INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Exploring Ethical Hacking', 'Self-study', 'Currently',
      'Setting up vulnerable VMs, running Nmap scans, learning Wireshark.', 1, 1
    );
    db.prepare(`INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'First Year of CSE', 'Rungta University', 'Currently',
      'Taking core CS courses.', 2, 1
    );
    console.log('DB: Seeded experience with defaults');
  }

  // Seed default admin user
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (usersCount.count === 0) {
    const hash = bcrypt.hashSync('soni123', 10);
    db.prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`).run(
      'admin@aditya.dev', hash, 'admin'
    );
    console.log('DB: Seeded default admin user (admin@aditya.dev / soni123)');
  }

  console.log('DB: All tables verified/created successfully');
}

module.exports = { initializeDatabase };
