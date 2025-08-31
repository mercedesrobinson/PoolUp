const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

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

// Initialize database with simple schema
let db;

const initializeDatabase = async () => {
  try {
    db = await open({
      filename: './poolup.db',
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Create simple tables for penalty system
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        goal_amount_cents INTEGER DEFAULT 0,
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
      
      CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pool_id INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (pool_id) REFERENCES pools (id)
      );
    `);
    
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
    
    if (!db) {
      return res.status(503).json({ error: 'Database not ready' });
    }
    
    const result = await db.run(
      'INSERT INTO users (name, created_at) VALUES (?, ?)',
      [name || 'Guest User', new Date().toISOString()]
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

    // Add creator as member
    await db.run(
      'INSERT INTO pool_memberships (pool_id, user_id, joined_at, penalty_agreed) VALUES (?, ?, ?, ?)',
      [result.lastID, userId, new Date().toISOString(), penaltyEnabled ? 1 : 0]
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

// Get user pools
app.get('/api/users/:userId/pools', async (req, res) => {
  try {
    const pools = await db.all(`
      SELECT p.*, pm.penalty_agreed 
      FROM pools p 
      JOIN pool_memberships pm ON p.id = pm.pool_id 
      WHERE pm.user_id = ?
    `, [req.params.userId]);
    res.json(pools);
  } catch (error) {
    console.error('Get pools error:', error);
    res.json([]);
  }
});

// Withdrawal endpoints
app.post('/api/pools/:poolId/withdraw', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { userId, amountCents, reason } = req.body;
    
    if (!userId || !amountCents || amountCents <= 0) {
      return res.status(400).json({ error: 'Valid userId and amountCents required' });
    }

    // Get pool details including penalty settings
    const pool = await db.get(`
      SELECT * FROM pools 
      WHERE id = ? AND penalty_enabled = 1
    `, [poolId]);

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found or penalties not enabled' });
    }

    // Calculate penalty if withdrawing before target date
    let penaltyAmount = 0;
    let isPenaltyApplicable = false;

    if (pool.trip_date) {
      const targetDate = new Date(pool.trip_date);
      const currentDate = new Date();
      
      if (currentDate < targetDate) {
        isPenaltyApplicable = true;
        penaltyAmount = Math.round(amountCents * (pool.penalty_percentage / 100));
      }
    }

    // Create withdrawal record
    const result = await db.run(`
      INSERT INTO withdrawals (
        pool_id, user_id, amount_cents, penalty_amount_cents, 
        reason, status, is_early_withdrawal, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      poolId, userId, amountCents, penaltyAmount, 
      reason || 'User withdrawal', isPenaltyApplicable, 
      new Date().toISOString()
    ]);

    res.json({
      withdrawalId: result.lastID,
      amountRequested: amountCents,
      penaltyAmount,
      netAmount: amountCents - penaltyAmount,
      isPenaltyApplicable,
      penaltyPercentage: pool.penalty_percentage,
      message: isPenaltyApplicable 
        ? `Early withdrawal penalty of ${pool.penalty_percentage}% (${penaltyAmount/100} dollars) will be applied`
        : 'No penalty applied - withdrawal after target date'
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// Get penalty status for a pool
app.get('/api/pools/:poolId/penalty-status', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const pool = await db.get(`
      SELECT penalty_enabled, penalty_percentage, penalty_requires_consensus, pool_type
      FROM pools WHERE id = ?
    `, [poolId]);

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    if (!pool.penalty_enabled) {
      return res.json({
        penaltyEnabled: false,
        message: 'No penalties configured for this pool'
      });
    }

    const members = await db.all(`
      SELECT u.name, pm.penalty_agreed, pm.penalty_agreed_at
      FROM pool_memberships pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.pool_id = ?
    `, [poolId]);

    const agreedCount = members.filter(m => m.penalty_agreed).length;
    const allAgreed = agreedCount === members.length;

    res.json({
      penaltyEnabled: true,
      penaltyPercentage: pool.penalty_percentage,
      requiresConsensus: pool.penalty_requires_consensus,
      poolType: pool.pool_type,
      members: members.map(m => ({
        name: m.name,
        agreed: !!m.penalty_agreed,
        agreedAt: m.penalty_agreed_at
      })),
      agreedCount,
      totalMembers: members.length,
      allMembersAgreed: allAgreed,
      penaltyActive: pool.pool_type === 'solo' || allAgreed
    });

  } catch (error) {
    console.error('Get penalty status error:', error);
    res.status(500).json({ error: 'Failed to get penalty status' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PoolUp Backend running on port ${PORT}`);
});
