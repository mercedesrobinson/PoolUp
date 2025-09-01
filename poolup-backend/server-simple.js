const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { PREMIUM_TIERS, calculateRevenue, getPremiumUpsells } = require('./premium');
const { PaymentIntegrations } = require('./payment-integrations');
const http = require('http');
const socketIo = require('socket.io');
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

// Initialize payment integrations
const paymentIntegrations = new PaymentIntegrations();

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
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'bank',
        external_transaction_id TEXT,
        fees_cents INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (pool_id) REFERENCES pools(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        method_type TEXT NOT NULL,
        method_data TEXT,
        is_verified BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS peer_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'completed',
        created_at TEXT NOT NULL,
        FOREIGN KEY (pool_id) REFERENCES pools (id),
        FOREIGN KEY (from_user_id) REFERENCES users (id),
        FOREIGN KEY (to_user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS solo_goal_privacy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pool_id INTEGER NOT NULL,
        show_goal_amount BOOLEAN DEFAULT 1,
        show_current_amount BOOLEAN DEFAULT 1,
        show_goal_purpose BOOLEAN DEFAULT 1,
        show_progress_bar BOOLEAN DEFAULT 1,
        show_in_discover BOOLEAN DEFAULT 1,
        show_in_leaderboard BOOLEAN DEFAULT 1,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (pool_id) REFERENCES pools (id),
        UNIQUE(user_id, pool_id)
      )
    `);
    
    global.db = db;
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

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
    console.log('Pool creation request:', req.body);
    const { userId, name, goalCents, destination, tripDate, poolType, penalty } = req.body;
    
    if (!userId || !name) {
      console.log('Missing required fields:', { userId, name });
      return res.status(400).json({ error: 'userId and name are required' });
    }
    
    // Allow pools without goal amounts (open-ended saving)
    let finalGoalCents = goalCents;
    if (goalCents === undefined || goalCents === null || goalCents === '') {
      finalGoalCents = 0;
    }

    const penaltyEnabled = penalty?.enabled || false;
    const penaltyPercentage = penalty?.percentage || 0;
    const penaltyRequiresConsensus = penalty?.requiresConsensus || false;

    console.log('Creating pool with data:', {
      name, 
      goalCents: finalGoalCents, 
      userId, 
      destination, 
      tripDate, 
      poolType: poolType || 'group',
      penaltyEnabled,
      penaltyPercentage,
      penaltyRequiresConsensus
    });

    const result = await db.run(
      'INSERT INTO pools (name, goal_amount_cents, current_amount_cents, creator_id, destination, trip_date, pool_type, penalty_enabled, penalty_percentage, penalty_requires_consensus, created_at) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, finalGoalCents, userId, destination, tripDate, poolType || 'group', penaltyEnabled, penaltyPercentage, penaltyRequiresConsensus, new Date().toISOString()]
    );

    console.log('Pool created with ID:', result.lastID);

    // Add creator as member
    await db.run(
      'INSERT INTO pool_memberships (pool_id, user_id, joined_at, penalty_agreed) VALUES (?, ?, ?, ?)',
      [result.lastID, userId, new Date().toISOString(), penaltyEnabled ? 1 : 0]
    );

    console.log('Creator added as member');

    res.json({ 
      id: result.lastID, 
      name, 
      goalCents: finalGoalCents, 
      destination, 
      tripDate, 
      poolType: poolType || 'group',
      penalty: {
        enabled: penaltyEnabled,
        percentage: penaltyPercentage,
        requiresConsensus: penaltyRequiresConsensus
      },
      success: true 
    });
  } catch (error) {
    console.error('Pool creation error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create pool', details: error.message });
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

// Payment integration endpoints
app.get('/api/users/:userId/payment-methods', async (req, res) => {
  try {
    const { userId } = req.params;
    const methods = await paymentIntegrations.getUserPaymentMethods(userId);
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

app.post('/api/users/:userId/payment-methods/link', async (req, res) => {
  try {
    const { userId } = req.params;
    const { method, credentials } = req.body;
    
    const result = await paymentIntegrations.linkPaymentMethod(userId, method, credentials);
    
    // Store in database
    await db.run(
      'INSERT OR REPLACE INTO payment_methods (user_id, method_type, method_data, is_verified, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, method, JSON.stringify(credentials), 1, new Date().toISOString()]
    );
    
    res.json(result);
  } catch (error) {
    console.error('Link payment method error:', error);
    res.status(500).json({ error: 'Failed to link payment method' });
  }
});

// Get user streak endpoint
app.get('/api/users/:userId/streak', async (req, res) => {
  try {
    console.log('Getting streak for user:', req.params.userId);
    
    // Calculate streak based on contributions
    const contributions = await db.all(`
      SELECT DATE(created_at) as contribution_date
      FROM contributions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.params.userId]);

    console.log('Found contributions:', contributions.length);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    if (contributions.length > 0) {
      const today = new Date();
      const lastContribution = new Date(contributions[0].contribution_date);
      const daysDiff = Math.floor((today - lastContribution) / (1000 * 60 * 60 * 24));
      
      console.log('Days since last contribution:', daysDiff);
      
      // If last contribution was within 7 days, start counting streak
      if (daysDiff <= 7) {
        currentStreak = 1;
        tempStreak = 1;
        
        // Count consecutive weeks with contributions
        for (let i = 1; i < contributions.length; i++) {
          const prevDate = new Date(contributions[i-1].contribution_date);
          const currDate = new Date(contributions[i].contribution_date);
          const weekDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24 * 7));
          
          if (weekDiff <= 1) {
            currentStreak++;
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }

    // Calculate next contribution window (next Friday)
    const nextFriday = new Date();
    const daysUntilFriday = (5 - nextFriday.getDay() + 7) % 7;
    if (daysUntilFriday === 0) nextFriday.setDate(nextFriday.getDate() + 7);
    else nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);

    const result = {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      next_contribution_window: nextFriday.toISOString(),
      days_until_next: daysUntilFriday || 7
    };

    console.log('Streak result:', result);
    res.json(result);
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Failed to get streak data' });
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

// Premium endpoints
app.get('/api/premium/tiers', (req, res) => {
  res.json(PREMIUM_TIERS);
});

app.get('/api/users/:userId/premium-upsells', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user's current tier and usage stats
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const poolsCreated = await db.get('SELECT COUNT(*) as count FROM pools WHERE creator_id = ?', [userId]);
    const contributions = await db.all('SELECT * FROM contributions WHERE user_id = ?', [userId]);
    
    const usage = {
      pools_created: poolsCreated.count,
      monthly_contributions: contributions.reduce((sum, c) => sum + c.amount_cents, 0) / 100
    };
    
    const upsells = getPremiumUpsells({ tier: user.tier || 'FREE' }, usage);
    res.json(upsells);
  } catch (error) {
    console.error('Premium upsells error:', error);
    res.json([]);
  }
});

app.post('/api/users/:userId/upgrade', async (req, res) => {
  try {
    const { tier } = req.body;
    if (!PREMIUM_TIERS[tier]) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    
    // Update user tier (in production, verify payment first)
    await db.run('UPDATE users SET tier = ? WHERE id = ?', [tier, req.params.userId]);
    res.json({ success: true, tier });
  } catch (error) {
    console.error('Premium upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade premium' });
  }
});

// Get user peer transfers
app.get('/api/users/:userId/peer-transfers', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const transfers = await db.all(`
      SELECT pt.*, 
             p.name as pool_name,
             u1.name as from_user_name,
             u2.name as to_user_name
      FROM peer_transfers pt
      JOIN pools p ON pt.pool_id = p.id
      JOIN users u1 ON pt.from_user_id = u1.id
      JOIN users u2 ON pt.to_user_id = u2.id
      WHERE pt.from_user_id = ? OR pt.to_user_id = ?
      ORDER BY pt.created_at DESC
    `, [userId, userId]);
    
    res.json(transfers);
  } catch (error) {
    console.error('Get peer transfers error:', error);
    res.status(500).json({ error: 'Failed to get peer transfers' });
  }
});

// Solo Goal Privacy Settings
app.get('/api/users/:userId/solo-goals/:poolId/privacy', async (req, res) => {
  try {
    const { userId, poolId } = req.params;
    
    const settings = await db.get(`
      SELECT * FROM solo_goal_privacy 
      WHERE user_id = ? AND pool_id = ?
    `, [userId, poolId]);
    
    res.json(settings || {
      show_goal_amount: true,
      show_current_amount: true,
      show_goal_purpose: true,
      show_progress_bar: true,
      show_in_discover: true,
      show_in_leaderboard: true
    });
  } catch (error) {
    console.error('Get solo goal privacy settings error:', error);
    res.status(500).json({ error: 'Failed to get privacy settings' });
  }
});

app.put('/api/users/:userId/solo-goals/:poolId/privacy', async (req, res) => {
  try {
    const { userId, poolId } = req.params;
    const settings = req.body;
    
    await db.run(`
      INSERT OR REPLACE INTO solo_goal_privacy 
      (user_id, pool_id, show_goal_amount, show_current_amount, show_goal_purpose, 
       show_progress_bar, show_in_discover, show_in_leaderboard, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, 
      poolId,
      settings.show_goal_amount ? 1 : 0,
      settings.show_current_amount ? 1 : 0,
      settings.show_goal_purpose ? 1 : 0,
      settings.show_progress_bar ? 1 : 0,
      settings.show_in_discover ? 1 : 0,
      settings.show_in_leaderboard ? 1 : 0,
      new Date().toISOString()
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Save solo goal privacy settings error:', error);
    res.status(500).json({ error: 'Failed to save privacy settings' });
  }
});

// Revenue analytics endpoint
app.get('/api/admin/revenue', async (req, res) => {
  try {
const users = await db.all(`
  SELECT u.*, 
        COALESCE(SUM(p.current_amount_cents), 0) as total_pooled_amount,
        COUNT(DISTINCT w.id) as monthly_withdrawals
  FROM users u
  LEFT JOIN pools p ON u.id = p.creator_id
  LEFT JOIN withdrawals w ON u.id = w.user_id 
        AND w.created_at > datetime('now', '-30 days')
  GROUP BY u.id
`);
  
const revenue = calculateRevenue(users);
res.json(revenue);
} catch (error) {
console.error('Revenue analytics error:', error);
res.status(500).json({ error: 'Failed to get revenue data' });
}
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    server.listen(PORT, () => {
      console.log(`PoolUp Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
