const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

const gamification = require('./gamification');
// const social = require('./social');
// const accountability = require('./accountability');
// const templates = require('./templates');
// const miniGames = require('./mini-games');
// const payday = require('./payday');
// const notifications = require('./notifications');

// Import banking API routes
const bankingRoutes = require('./banking-api');
const authMiddleware = require('./auth-middleware');
const withdrawalPenalties = require('./withdrawal-penalties');

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

const initializeDatabase = async () => {
  try {
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
        avatar_type TEXT DEFAULT 'generated',
        avatar_data TEXT,
        profile_image_url TEXT,
        total_points INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        balance_cents INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT TRUE,
        allow_encouragement BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL
      );
    
      CREATE TABLE IF NOT EXISTS pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        goal_amount_cents INTEGER NOT NULL,
        current_amount_cents INTEGER DEFAULT 0,
        creator_id INTEGER NOT NULL,
        destination TEXT,
        trip_date TEXT,
        pool_type TEXT DEFAULT 'group',
        penalty_enabled BOOLEAN DEFAULT 0,
        penalty_percentage REAL DEFAULT 0,
        penalty_requires_consensus BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pool_id INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'manual',
        bank_account_id TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (pool_id) REFERENCES pools (id)
      );
      
      CREATE TABLE IF NOT EXISTS pool_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TEXT NOT NULL,
        penalty_agreed BOOLEAN DEFAULT 0,
        penalty_agreed_at TEXT,
        FOREIGN KEY (pool_id) REFERENCES pools (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(pool_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        penalty_amount_cents INTEGER DEFAULT 0,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        is_early_withdrawal BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        processed_at TEXT,
        FOREIGN KEY (pool_id) REFERENCES pools (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    
    // Make db available globally
    global.db = db;
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'PoolUp Backend is running!' });
});

// Guest user creation
app.post('/api/auth/guest', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Wait for db to be initialized
    if (!db) {
      return res.status(503).json({ error: 'Database not ready' });
    }
    
    const userId = Date.now().toString();
    const result = await db.run(
      'INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)',
      [userId, name || 'Guest User', new Date().toISOString()]
    );
    
    const user = {
      id: userId,
      name: name || 'Guest User',
      authProvider: 'guest'
    };
    res.json(user);
  } catch (error) {
    console.error('Guest user creation error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create guest user', details: error.message });
  }
});

// Google user creation/login
app.post('/api/auth/google', async (req, res) => {
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

// Add basic API routes first (without auth)
app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      xp: 150,
      total_points: 250,
      current_streak: 3,
      badge_count: 2,
      avatar_type: user.avatar_type || 'default',
      avatar_data: user.avatar_data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.get('/api/users/:userId/badges', async (req, res) => {
  res.json([
    { id: 1, name: 'First Contribution', description: 'Made your first pool contribution', icon: '🎯' },
    { id: 2, name: 'Streak Master', description: '7-day contribution streak', icon: '🔥' }
  ]);
});

// Create pool endpoint
app.post('/api/pools', async (req, res) => {
  try {
    const { userId, name, goalCents, destination, tripDate, poolType, penalty } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }
    
    // Allow pools without goal amounts (open-ended saving)
    if (goalCents === undefined || goalCents === null || goalCents === '') {
      goalCents = 0;
    }

    const penaltyEnabled = penalty?.enabled || false;
    const penaltyPercentage = penalty?.percentage || 0;
    const penaltyRequiresConsensus = penalty?.requiresConsensus || false;

    const result = await db.run(
      'INSERT INTO pools (name, goal_amount_cents, current_amount_cents, creator_id, destination, trip_date, pool_type, penalty_enabled, penalty_percentage, penalty_requires_consensus, created_at) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, goalCents, userId, destination, tripDate, poolType || 'group', penaltyEnabled, penaltyPercentage, penaltyRequiresConsensus, new Date().toISOString()]
    );

    res.json({ 
      id: result.lastID, 
      name, 
      goalCents, 
      destination, 
      tripDate, 
      poolType,
      penalty: {
        enabled: penaltyEnabled,
        percentage: penaltyPercentage,
        requiresConsensus: penaltyRequiresConsensus
      },
      success: true 
    });
  } catch (error) {
    console.error('Pool creation error:', error);
    res.status(500).json({ error: 'Failed to create pool' });
  }
});

app.get('/api/users/:userId/pools', async (req, res) => {
  try {
    const pools = await db.all('SELECT * FROM pools WHERE creator_id = ?', [req.params.userId]);
    res.json(pools);
  } catch (error) {
    console.error('Get pools error:', error);
    res.json([]);
  }
});

// Payday settings endpoints (simplified for now)
app.get('/api/users/:userId/payday-settings', async (req, res) => {
  try {
    res.json({
      frequency: 'weekly',
      weekly_day: 'friday',
      reminders_enabled: true,
      reminder_days_before: 1
    });
  } catch (error) {
    console.error('Get payday settings error:', error);
    res.status(500).json({ error: 'Failed to get payday settings' });
  }
});

app.post('/api/users/:userId/payday-settings', async (req, res) => {
  try {
    // For now, just return success
    res.json({ success: true });
  } catch (error) {
    console.error('Update payday settings error:', error);
    res.status(500).json({ error: 'Failed to update payday settings' });
  }
});

app.get('/api/users/:userId/streak', async (req, res) => {
  try {
    res.json({
      current_streak: 5,
      longest_streak: 12,
      next_contribution_window: new Date(Date.now() + 86400000).toISOString()
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Failed to get streak data' });
  }
});

// Notification endpoints (simplified for now)
app.post('/api/users/:userId/push-token', async (req, res) => {
  try {
    const { pushToken } = req.body;
    console.log(`Stored push token for user ${req.params.userId}: ${pushToken}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Store push token error:', error);
    res.status(500).json({ error: 'Failed to store push token' });
  }
});

app.post('/api/users/:userId/notification-preferences', async (req, res) => {
  try {
    console.log(`Updated notification preferences for user ${req.params.userId}:`, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

app.post('/api/notifications/send-test', async (req, res) => {
  try {
    const { userId, pushToken } = req.body;
    console.log(`Test notification sent to user ${userId} with token ${pushToken}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Use banking API routes with auth middleware for protected routes
app.use('/api', authMiddleware, bankingRoutes);

// Use withdrawal penalties routes
app.use('/api', withdrawalPenalties);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PoolUp Backend running on port ${PORT}`);
});
