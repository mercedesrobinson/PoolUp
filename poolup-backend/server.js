const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

// Import banking API routes
const bankingRoutes = require('./banking-api');
const authMiddleware = require('./auth-middleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize database
let db;
(async () => {
  db = await open({
    filename: './poolup.db',
    driver: sqlite3.Database
  });
  
  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      google_id TEXT UNIQUE,
      auth_provider TEXT DEFAULT 'guest',
      stripe_customer_id TEXT,
      profile_image TEXT,
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      goal_amount_cents INTEGER NOT NULL,
      current_amount_cents INTEGER DEFAULT 0,
      creator_id INTEGER NOT NULL,
      visual_theme TEXT DEFAULT 'beach_vacation',
      created_at TEXT NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS user_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      pool_id INTEGER,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_contribution_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (pool_id) REFERENCES pools(id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      type TEXT NOT NULL,
      requirement_value INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (badge_id) REFERENCES badges(id)
    );

    CREATE TABLE IF NOT EXISTS pool_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      milestone_type TEXT NOT NULL,
      target_amount_cents INTEGER,
      target_percentage REAL,
      achieved BOOLEAN DEFAULT FALSE,
      achieved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id)
    );

    CREATE TABLE IF NOT EXISTS forfeits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      reason TEXT,
      charity_id TEXT,
      donation_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      FOREIGN KEY (pool_id) REFERENCES pools(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS peer_boosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id INTEGER NOT NULL,
      booster_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id),
      FOREIGN KEY (booster_id) REFERENCES users(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS charities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      website_url TEXT,
      stripe_account_id TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pool_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      default_name TEXT,
      suggested_goal_cents INTEGER,
      default_destination TEXT,
      default_theme TEXT DEFAULT 'beach_vacation',
      pool_type TEXT DEFAULT 'group',
      popularity_score INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      suggested_by INTEGER,
      status TEXT DEFAULT 'active',
      active BOOLEAN DEFAULT TRUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (suggested_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS template_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote_type TEXT NOT NULL,
      voted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES pool_templates(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  
  console.log('Database initialized successfully');
})();

// Make db available globally
global.db = db;

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'PoolUp Backend is running!' });
});

// Guest user creation
app.post('/api/guest', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.run(
      'INSERT INTO users (name, auth_provider, created_at) VALUES (?, ?, ?)',
      [name || 'Guest User', 'guest', new Date().toISOString()]
    );
    
    const user = {
      id: result.lastID,
      name: name || 'Guest User',
      authProvider: 'guest'
    };
    res.json(user);
  } catch (error) {
    console.error('Guest user creation error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// Google user creation/login
app.post('/api/google-user', async (req, res) => {
  try {
    const { id: google_id, name, email, photo } = req.body;
    
    // Check if user exists
    let user = await db.get('SELECT * FROM users WHERE google_id = ? OR email = ?', [google_id, email]);
    
    if (!user) {
      // Create new Google user
      const result = await db.run(
        'INSERT INTO users (google_id, name, email, profile_image, auth_provider, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [google_id, name, email, photo, 'google', new Date().toISOString()]
      );
      
      user = {
        id: result.lastID,
        google_id,
        name,
        email,
        profileImage: photo,
        authProvider: 'google'
      };
    } else {
      // Update existing user with Google info if needed
      if (!user.google_id) {
        await db.run(
          'UPDATE users SET google_id = ?, profile_image = ?, auth_provider = ? WHERE id = ?',
          [google_id, photo, 'google', user.id]
        );
      }
      
      user = {
        id: user.id,
        google_id: user.google_id || google_id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image || photo,
        authProvider: user.auth_provider
      };
    }
    
    res.json(user);
  } catch (error) {
    console.error('Google user creation error:', error);
    res.status(500).json({ error: 'Failed to create/login Google user' });
  }
});

// Use banking API routes with auth middleware
app.use('/api', authMiddleware, bankingRoutes);

// Routes
app.use('/api/gamification', require('./gamification'));
app.use('/api/social', require('./social'));
app.use('/api/accountability', require('./accountability'));
app.use('/api/templates', require('./templates'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PoolUp Backend running on port ${PORT}`);
});
