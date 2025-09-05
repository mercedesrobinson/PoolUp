import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import dotenv from 'dotenv';

import gamificationRouter from './gamification';
import bankingRoutes from './banking-api';
import authenticateUser from './auth-middleware';
import withdrawalPenalties from './withdrawal-penalties';
import { User, Pool, Contribution, ApiResponse } from './types';

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

// Initialize database
let db: SqliteDatabase;

const initializeDatabase = async (): Promise<void> => {
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
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_type TEXT DEFAULT 'avatar',
        avatar_data TEXT,
        profile_image_url TEXT,
        google_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        goal_amount INTEGER NOT NULL,
        current_amount INTEGER DEFAULT 0,
        target_date DATE NOT NULL,
        created_by INTEGER NOT NULL,
        pool_type TEXT DEFAULT 'group',
        public_visibility BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS pool_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        role TEXT DEFAULT 'member',
        FOREIGN KEY (pool_id) REFERENCES pools (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(pool_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pool_id) REFERENCES pools (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pool_id) REFERENCES pools (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// User routes
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { email, name, avatar_type, avatar_data, profile_image_url, google_id } = req.body;
    
    const result = await db.run(
      'INSERT INTO users (email, name, avatar_type, avatar_data, profile_image_url, google_id) VALUES (?, ?, ?, ?, ?, ?)',
      [email, name, avatar_type, avatar_data, profile_image_url, google_id]
    );
    
    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pool routes
app.post('/api/pools', async (req: Request, res: Response) => {
  try {
    const { name, description, goal_amount, target_date, created_by, pool_type, public_visibility } = req.body;
    
    const result = await db.run(
      'INSERT INTO pools (name, description, goal_amount, target_date, created_by, pool_type, public_visibility) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, goal_amount, target_date, created_by, pool_type || 'group', public_visibility || 0]
    );
    
    // Add creator as admin member
    await db.run(
      'INSERT INTO pool_memberships (pool_id, user_id, role) VALUES (?, ?, ?)',
      [result.lastID, created_by, 'admin']
    );
    
    const pool = await db.get('SELECT * FROM pools WHERE id = ?', [result.lastID]);
    res.json({ success: true, data: pool });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/pools', async (req: Request, res: Response) => {
  try {
    const pools = await db.all(`
      SELECT p.*, u.name as creator_name,
             COUNT(pm.user_id) as member_count,
             COALESCE(SUM(c.amount), 0) as current_amount
      FROM pools p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN pool_memberships pm ON p.id = pm.pool_id
      LEFT JOIN contributions c ON p.id = c.pool_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: pools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/pools/:id', async (req: Request, res: Response) => {
  try {
    const pool = await db.get(`
      SELECT p.*, u.name as creator_name,
             COUNT(pm.user_id) as member_count,
             COALESCE(SUM(c.amount), 0) as current_amount
      FROM pools p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN pool_memberships pm ON p.id = pm.pool_id
      LEFT JOIN contributions c ON p.id = c.pool_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);
    
    if (!pool) {
      res.status(404).json({ success: false, error: 'Pool not found' });
      return;
    }
    
    // Get pool members
    const members = await db.all(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM pool_memberships pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.pool_id = ?
      ORDER BY pm.joined_at ASC
    `, [req.params.id]);
    
    // Get recent contributions
    const contributions = await db.all(`
      SELECT c.*, u.name as user_name
      FROM contributions c
      JOIN users u ON c.user_id = u.id
      WHERE c.pool_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `, [req.params.id]);
    
    res.json({ 
      success: true, 
      data: { 
        ...pool, 
        members, 
        contributions 
      } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contribution routes
app.post('/api/contributions', async (req: Request, res: Response) => {
  try {
    const { pool_id, user_id, amount, description } = req.body;
    
    const result = await db.run(
      'INSERT INTO contributions (pool_id, user_id, amount, description) VALUES (?, ?, ?, ?)',
      [pool_id, user_id, amount, description]
    );
    
    const contribution = await db.get(`
      SELECT c.*, u.name as user_name
      FROM contributions c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);
    
    // Emit real-time update
    io.to(`pool_${pool_id}`).emit('new_contribution', contribution);
    
    res.json({ success: true, data: contribution });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Message routes
app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const { pool_id, user_id, content } = req.body;
    
    const result = await db.run(
      'INSERT INTO messages (pool_id, user_id, content) VALUES (?, ?, ?)',
      [pool_id, user_id, content]
    );
    
    const message = await db.get(`
      SELECT m.*, u.name as user_name
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `, [result.lastID]);
    
    // Emit real-time update
    io.to(`pool_${pool_id}`).emit('new_message', message);
    
    res.json({ success: true, data: message });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/messages/:poolId', async (req: Request, res: Response) => {
  try {
    const messages = await db.all(`
      SELECT m.*, u.name as user_name
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.pool_id = ?
      ORDER BY m.created_at ASC
    `, [req.params.poolId]);
    
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_pool', (poolId: string) => {
    socket.join(`pool_${poolId}`);
    console.log(`User ${socket.id} joined pool ${poolId}`);
  });
  
  socket.on('leave_pool', (poolId: string) => {
    socket.leave(`pool_${poolId}`);
    console.log(`User ${socket.id} left pool ${poolId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Mount additional routes
app.use('/api/banking', bankingRoutes);
app.use('/api/gamification', gamificationRouter);
app.use('/api/penalties', withdrawalPenalties);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`PoolUp server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
