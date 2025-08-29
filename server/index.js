import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import db from './db.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.ORIGIN?.split(',') || "*", methods: ["GET","POST"] }
});

app.use(cors({ origin: process.env.ORIGIN?.split(',') || "*"}));
app.use(express.json());

// --- Simple "auth" via name only (MVP) ---
app.post('/api/auth/guest', (req,res)=>{
  const { name } = req.body;
  if(!name) return res.status(400).json({error:"name required"});
  const id = uuid();
  db.prepare("INSERT INTO users (id,name,avatar) VALUES (?,?,?)").run(id, name, null);
  res.json({ id, name });
});

// Create a pool
app.post('/api/pools', (req,res)=>{
  const { ownerId, name, goalCents } = req.body;
  if(!ownerId || !name || !goalCents) return res.status(400).json({error:"ownerId, name, goalCents required"});
  const id = uuid();
  db.prepare("INSERT INTO pools (id,name,goal_cents,owner_id) VALUES (?,?,?,?)").run(id, name, goalCents, ownerId);
  db.prepare("INSERT INTO memberships (user_id,pool_id,role) VALUES (?,?,?)").run(ownerId, id, 'owner');
  res.json({ id, name, goalCents });
});

// Join a pool
app.post('/api/pools/:poolId/join', (req,res)=>{
  const { userId } = req.body;
  const { poolId } = req.params;
  if(!userId) return res.status(400).json({error:"userId required"});
  db.prepare("INSERT OR IGNORE INTO memberships (user_id,pool_id,role) VALUES (?,?,?)").run(userId, poolId, 'member');
  res.json({ ok:true });
});

// List pools for a user
app.get('/api/users/:userId/pools', (req,res)=>{
  const { userId } = req.params;
  const pools = db.prepare(`
    SELECT p.*, 
      COALESCE((SELECT SUM(amount_cents) FROM contributions c WHERE c.pool_id = p.id),0) AS saved_cents
    FROM pools p 
    JOIN memberships m ON m.pool_id = p.id
    WHERE m.user_id = ?
    ORDER BY p.created_at DESC
  `).all(userId);
  res.json(pools);
});

// Get single pool detail
app.get('/api/pools/:poolId', (req,res)=>{
  const { poolId } = req.params;
  const pool = db.prepare("SELECT * FROM pools WHERE id = ?").get(poolId);
  if(!pool) return res.status(404).json({error:"not found"});
  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar FROM users u 
    JOIN memberships m ON m.user_id = u.id
    WHERE m.pool_id = ?
  `).all(poolId);
  const contributions = db.prepare(`SELECT * FROM contributions WHERE pool_id = ? ORDER BY created_at DESC`).all(poolId);
  const saved_cents = db.prepare(`SELECT COALESCE(SUM(amount_cents),0) as total FROM contributions WHERE pool_id = ?`).get(poolId).total;
  res.json({ ...pool, members, contributions, saved_cents });
});

// Contribute
app.post('/api/pools/:poolId/contributions', (req,res)=>{
  const { poolId } = req.params;
  const { userId, amountCents } = req.body;
  if(!userId || !amountCents) return res.status(400).json({error:"userId, amountCents required"});
  const id = uuid();
  db.prepare("INSERT INTO contributions (id,pool_id,user_id,amount_cents) VALUES (?,?,?,?)").run(id, poolId, userId, amountCents);
  const payload = { id, poolId, userId, amountCents };
  io.to(poolId).emit('contribution:new', payload);
  res.json(payload);
});

// Messages
app.get('/api/pools/:poolId/messages', (req,res)=>{
  const { poolId } = req.params;
  const messages = db.prepare("SELECT * FROM messages WHERE pool_id = ? ORDER BY created_at ASC").all(poolId);
  res.json(messages);
});

app.post('/api/pools/:poolId/messages', (req,res)=>{
  const { poolId } = req.params;
  const { userId, body } = req.body;
  const id = uuid();
  db.prepare("INSERT INTO messages (id,pool_id,user_id,body) VALUES (?,?,?,?)").run(id, poolId, userId, body);
  const msg = { id, poolId, userId, body };
  io.to(poolId).emit('message:new', msg);
  res.json(msg);
});

// --- Socket.IO rooms for real-time updates ---
io.on('connection', (socket)=>{
  socket.on('room:join', (poolId)=>{
    socket.join(poolId);
  });
});

const port = process.env.PORT || 4000;
httpServer.listen(port, ()=> console.log(`server on http://localhost:${port}`));
