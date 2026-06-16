const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { initializeDatabase } = require('./db/schema');
const { closeDb } = require('./db/connection');
const corsMiddleware = require('./middleware/cors');
const { rateLimitMiddleware } = require('./middleware/rateLimit');
const { auditMiddleware } = require('./middleware/auditLog');

// Route modules
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const contactRoutes = require('./routes/contact');
const messagesRoutes = require('./routes/messages');
const bookingsRoutes = require('./routes/bookings');
const projectsRoutes = require('./routes/projects');
const educationRoutes = require('./routes/education');
const experienceRoutes = require('./routes/experience');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize database
initializeDatabase();

const app = express();

// ---- Middleware ----
app.use(compression());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimitMiddleware());

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/login', authRoutes); // Legacy compatibility
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/booking-submit', bookingsRoutes); // Legacy compatibility
app.use('/api/projects', projectsRoutes);
app.use('/api/projects-crud', projectsRoutes); // Legacy compatibility
app.use('/api/education', educationRoutes);
app.use('/api/education-crud', educationRoutes); // Legacy compatibility
app.use('/api/experience', experienceRoutes);
app.use('/api/experience-crud', experienceRoutes); // Legacy compatibility
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---- Static Files: Uploads ----
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Static Files: Admin SPA ----
const adminBuildPath = path.join(__dirname, '..', 'admin', 'dist');
if (fs.existsSync(adminBuildPath)) {
  app.use('/admin', express.static(adminBuildPath));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminBuildPath, 'index.html'));
  });
} else {
  // In development, admin is served by Vite dev server on port 5173
  console.log('INFO: Admin SPA not built yet. Run "npm run build:admin" or use Vite dev server.');
}

// ---- Static Files: Public Portfolio Site ----
// Serve all existing HTML/CSS/JS files from root directory
const publicFiles = [
  'index.html', 'about.html', 'contact.html', 'education.html',
  'projects.html', 'goals.html', 'login.html', 'style.css', 'main.js',
  'profile.png', 'aditya-hero.jpg', 'img-cyber.png', 'img-goals.png',
  'img-mern.png', 'img-mission.png', 'img-stats.png', 'portfolio.db',
  'admin.html'
];

const rootDir = path.join(__dirname, '..');

// Serve specific static files from root
for (const file of publicFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    app.get(`/${file}`, (req, res) => res.sendFile(filePath));
  }
}

// Serve lib directory for JAR files (if still needed)
app.use('/lib', express.static(path.join(rootDir, 'lib')));

// Default route -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Catch-all for other static files
app.use(express.static(rootDir, { index: false }));

// ---- Error Handler ----
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  if (err.name === 'MulterError') {
    return res.status(400).json({ status: 'error', message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

// ---- Start Server ----
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(' Premium Portfolio Backend Active (Node.js)');
  console.log(` Server running at: http://localhost:${PORT}`);
  console.log(' Database: SQLite [portfolio.db]');
  console.log(` Admin Panel: http://localhost:${PORT}/admin`);
  console.log(' Press Ctrl+C to stop.');
  console.log('====================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
});

module.exports = app;
