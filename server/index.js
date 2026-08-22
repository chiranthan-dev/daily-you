const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Allow multiple origins: local dev + production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

// Vercel gives every preview deployment its own generated hostname, so match
// those by pattern rather than listing them one by one.
const previewOriginPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) || previewOriginPattern.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no origin (Postman, curl, server-to-server) are allowed.
    if (!origin) return callback(null, true);
    // Deny by returning false, never by throwing — throwing here escapes into
    // the error handler and returns a confusing 500 instead of a CORS refusal.
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true
}));
app.use(express.json());

// Auto-save: when deadline passes, unsaved goals from previous days are auto-submitted
const autoSaveGoals = require('./middleware/autoSaveGoals');

// Routes
app.use('/api/auth', require('./routes/auth'));
// Goals + User routes get autoSaveGoals middleware (it checks auth internally)
app.use('/api/goals', require('./middleware/auth'), autoSaveGoals, require('./routes/goals'));
app.use('/api/user', require('./middleware/auth'), autoSaveGoals, require('./routes/user'));
app.use('/api/sleep', require('./routes/sleep'));
app.use('/api/macros', require('./routes/macros'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/items', require('./routes/items'));
app.use('/api/friends', require('./routes/friends'));

// Health check. Mounted under /api as well so the frontend can reach it
// through its configured API base URL (used to wake the server on page load).
const health = (req, res) => res.json({
  status: 'ok',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  uptime: process.uptime()
});
app.get('/health', health);
app.get('/api/health', health);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.warn('⚠️  MongoDB not connected – API calls requiring a DB will fail.');
    console.warn('   Set MONGODB_URI in server/.env to enable full functionality.');
    console.warn('   Error:', err.message);
  });
