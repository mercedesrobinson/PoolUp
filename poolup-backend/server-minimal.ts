import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database('poolup.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    google_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    goal_cents INTEGER DEFAULT 0,
    saved_cents INTEGER DEFAULT 0,
    destination TEXT,
    trip_date TEXT,
    pool_type TEXT DEFAULT 'group',
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );


  CREATE TABLE IF NOT EXISTS pool_memberships (
    id TEXT PRIMARY KEY,
    pool_id TEXT,
    user_id TEXT,
    role TEXT DEFAULT 'member',
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pool_id) REFERENCES pools (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    pool_id TEXT,
    user_id TEXT,
    amount_cents INTEGER,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pool_id) REFERENCES pools (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Mock user for development
const mockUser = {
  id: '1756612920173',
  name: 'Mercedes',
  email: 'mercedes@example.com',
  created_at: new Date().toISOString()
};

// Ensure mock user exists
const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(mockUser.id);
if (!existingUser) {
  db.prepare('INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)').run(
    mockUser.id, mockUser.name, mockUser.email, mockUser.created_at
  );
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/guest', (req: Request, res: Response) => {
  res.json({
    success: true,
    user: mockUser,
    token: 'mock-token'
  });
});

// User endpoints
app.get('/api/users/:userId/profile', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) || mockUser;
  res.json({
    ...user,
    xp: 150,
    total_points: 250,
    current_streak: 3,
    level: 2
  });
});

// Pool endpoints
app.post('/api/pools', (req: Request, res: Response) => {
  try {
    const { userId, name, goalCents, destination, tripDate, poolType } = req.body;
    const poolId = Date.now().toString();
    
    // Insert pool
    db.prepare(`
      INSERT INTO pools (id, name, goal_cents, destination, trip_date, pool_type, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(poolId, name, goalCents || 0, destination, tripDate, poolType || 'group', userId);
    
    // Add creator as admin member
    db.prepare(`
      INSERT INTO pool_memberships (id, pool_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).run(Date.now().toString() + '_member', poolId, userId, 'admin');
    
    res.json({
      success: true,
      data: {
        id: poolId,
        name,
        goalCents,
        destination,
        tripDate,
        poolType,
        createdBy: userId,
        savedCents: 0,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Pool creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create pool' });
  }
});

app.get('/api/users/:userId/pools', (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const pools = db.prepare(`
    SELECT p.*, pm.role
    FROM pools p
    JOIN pool_memberships pm ON p.id = pm.pool_id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(userId);
  
  res.json({ success: true, data: pools });
});

// Transaction endpoints
app.get('/api/users/:userId/transactions', (req: Request, res: Response) => {
  const transactions = [
    {
      id: '1',
      type: 'contribution',
      amount: 15000,
      description: 'Monthly contribution',
      date: '2024-01-15',
      pool_name: 'Emergency Fund'
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: -5000,
      description: 'Emergency expense',
      date: '2024-01-10',
      pool_name: 'Emergency Fund'
    }
  ];
  
  res.json({ success: true, data: transactions });
});

// Payment methods
app.get('/api/users/:userId/payment-methods', (req: Request, res: Response) => {
  const paymentMethods = [
    {
      id: 'pm_1',
      type: 'bank_account',
      last4: '1234',
      bank_name: 'Chase Bank',
      is_verified: true
    },
    {
      id: 'pm_2',
      type: 'debit_card',
      last4: '5678',
      brand: 'Visa',
      is_verified: true
    }
  ];
  
  res.json(paymentMethods);
});

// Progress data
app.get('/api/pools/:poolId/progress', (req: Request, res: Response) => {
  const progressData = {
    poolId: req.params.poolId,
    totalSaved: 15000,
    goalAmount: 50000,
    progressPercentage: 30,
    daysRemaining: 180,
    streakDays: 7,
    lastContribution: '2024-01-15'
  };
  
  res.json(progressData);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 PoolUp Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
