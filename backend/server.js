const fs = require('fs');
const path = require('path');
const http = require('http');

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Simple file-based DB
function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      users: [],
      pools: [],
      memberships: [], // {poolId, userId, role}
      contributions: [], // {id, poolId, userId, amountCents, createdAt}
      messages: [], // {id, poolId, userId, body, createdAt}
      follows: [], // {userId, followerId}
      encouragements: [], // {id, fromUserId, toUserId, poolId, message, type, createdAt}
      cards: [], // {userId, cardId, cardNumber, expMonth, expYear, cvv, status}
      cardTransactions: [], // {id, userId, cardId, amountCents, merchant, category, createdAt}
      invites: [], // {poolId, code, email, createdAt}
      recurring: [], // {poolId, userId, settings}
      penaltySettings: {}, // poolId -> settings
      privacy: {}, // userId -> settings
      notifications: { tokens: {}, preferences: {} }, // tokens[userId] = token, preferences[userId] = {...}
      seq: 1
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  }
}

function loadDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(db) {
  const id = db.seq++;
  return String(id);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = String(payload.sub);
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function getUserByEmail(db, email) {
  const e = String(email || '').toLowerCase();
  return db.users.find(u => (u.email || '').toLowerCase() === e);
}

function publicUser(u) {
  return { id: String(u.id), name: u.name, email: u.email, profile_image_url: u.profile_image_url || null };
}

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: false
}));
app.use(express.json());

// Basic health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth: guest login
app.post('/auth/guest', (req, res) => {
  const { name } = req.body || {};
  const db = loadDB();
  const user = {
    id: nextId(db),
    name: name || 'Guest',
    email: null,
    profile_image_url: null,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveDB(db);
  res.json({ id: user.id, name: user.name, email: user.email, profileImage: user.profile_image_url });
});

// Auth: email/password signup
app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = loadDB();
    if (getUserByEmail(db, email)) return res.status(409).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(String(password), 10);
    const user = {
      id: nextId(db),
      name: name || String(email).split('@')[0],
      email: String(email).toLowerCase(),
      password_hash: hash,
      profile_image_url: null,
      created_at: new Date().toISOString(),
      profile_image_url: null
    };
    db.users.push(user);
    saveDB(db);
    const token = signToken(user.id);
    return res.json({ token, user: publicUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Signup failed' });
  }
});

// Auth: email/password login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = loadDB();
    const user = getUserByEmail(db, email);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.id);
    return res.json({ token, user: publicUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Auth: current user
app.get('/auth/me', auth, (req, res) => {
  const db = loadDB();
  const u = db.users.find(x => String(x.id) === String(req.userId));
  if (!u) return res.status(404).json({ error: 'Not found' });
  return res.json({ user: publicUser(u) });
});

// Users
app.post('/api/users', (req, res) => {
  const { google_id, name, email, profile_image_url } = req.body || {};
  const db = loadDB();
  const user = {
    id: nextId(db),
    google_id: google_id || null,
    name: name || 'User',
    email: email || null,
    profile_image_url: profile_image_url || null,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveDB(db);
  res.json({ data: user });
});

app.get('/api/users/:id/profile', (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  // Simple derived stats
  const contributions = db.contributions.filter(c => String(c.userId) === String(user.id));
  const totalPoints = Math.min(1000, contributions.length * 10);
  const streak = Math.min(30, contributions.length);
  const badges = Math.floor(contributions.length / 5);
  res.json({
    id: String(user.id),
    name: user.name,
    xp: totalPoints,
    total_points: totalPoints,
    current_streak: streak,
    badge_count: badges,
    profile_image_url: user.profile_image_url || null
  });
});

// Pools
app.get('/api/pools', (_req, res) => {
  const db = loadDB();
  const items = db.pools.map(p => ({
    id: p.id,
    name: p.name,
    goal_amount: p.goal_cents,
    current_amount: p.saved_cents || 0,
    description: p.destination || null,
    created_by: p.creator_id
  }));
  res.json({ data: items });
});

app.post('/api/pools', (req, res) => {
  const { name, description, goal_amount, target_date, created_by, pool_type, public_visibility } = req.body || {};
  const db = loadDB();
  const pool = {
    id: nextId(db),
    name: name || 'Untitled',
    goal_cents: Number(goal_amount) || 0,
    saved_cents: 0,
    destination: description || null,
    trip_date: target_date || null,
    pool_type: pool_type || 'group',
    creator_id: Number(created_by) || 1,
    public_visibility: public_visibility ? 1 : 0,
    bonus_pot_cents: 0
  };
  db.pools.push(pool);
  // Add creator as member
  db.memberships.push({ poolId: pool.id, userId: String(pool.creator_id), role: 'owner' });
  saveDB(db);
  res.json({ data: pool });
});

app.get('/api/pools/:id', (req, res) => {
  const db = loadDB();
  const p = db.pools.find(pp => String(pp.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  const members = db.memberships
    .filter(m => String(m.poolId) === String(p.id))
    .map(m => {
      const u = db.users.find(x => String(x.id) === String(m.userId));
      return { id: String(m.userId), name: u?.name || `User ${m.userId}`, role: m.role };
    });
  const contributions = db.contributions
    .filter(c => String(c.poolId) === String(p.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(c => ({ id: c.id, pool_id: String(c.poolId), user_id: String(c.userId), amount_cents: c.amountCents, created_at: c.createdAt, points_earned: c.points || 0, streak_bonus: c.streak > 1 }));

  res.json({
    id: p.id,
    name: p.name,
    goal_cents: p.goal_cents,
    saved_cents: p.saved_cents || 0,
    destination: p.destination,
    trip_date: p.trip_date,
    pool_type: p.pool_type || 'group',
    bonus_pot_cents: p.bonus_pot_cents || 0,
    members,
    contributions
  });
});

// Per-user pools
app.get('/api/users/:id/pools', (req, res) => {
  const db = loadDB();
  const userId = String(req.params.id);
  const poolIds = db.memberships.filter(m => String(m.userId) === userId).map(m => String(m.poolId));
  const items = db.pools.filter(p => poolIds.includes(String(p.id))).map(p => ({
    id: p.id,
    name: p.name,
    goal_cents: p.goal_cents,
    saved_cents: p.saved_cents || 0,
    destination: p.destination,
    creator_id: p.creator_id
  }));
  res.json(items);
});

// Contributions
app.post('/api/contributions', (req, res) => {
  const { pool_id, user_id, amount, description } = req.body || {};
  const db = loadDB();
  const pool = db.pools.find(p => String(p.id) === String(pool_id));
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  const id = nextId(db);
  const contribution = {
    id,
    poolId: String(pool_id),
    userId: String(user_id),
    amountCents: Number(amount) || 0,
    description: description || 'manual',
    createdAt: new Date().toISOString()
  };
  db.contributions.push(contribution);
  pool.saved_cents = (pool.saved_cents || 0) + contribution.amountCents;

  // Simple gamification
  const userContribs = db.contributions.filter(c => String(c.userId) === String(user_id));
  const points = Math.max(5, Math.round(contribution.amountCents / 100));
  const streak = Math.min(30, userContribs.length);
  const newBadges = (userContribs.length % 5 === 0) ? [{ id: 'badge_saver', name: 'Consistent Saver' }] : [];

  saveDB(db);
  io.to(String(pool_id)).emit('contribution:new', { poolId: String(pool_id), contribution: { id, amountCents: contribution.amountCents }, newBadges });
  res.json({ success: true, points, streak, newBadges });
});

// Messages (both routes used in FE)
app.get('/api/pools/:poolId/messages', (req, res) => {
  const db = loadDB();
  const items = db.messages
    .filter(m => String(m.poolId) === String(req.params.poolId))
    .map(m => ({ id: m.id, pool_id: m.poolId, user_id: m.userId, body: m.body, created_at: m.createdAt }));
  res.json(items);
});

app.get('/api/messages/:poolId', (req, res) => {
  const db = loadDB();
  const items = db.messages
    .filter(m => String(m.poolId) === String(req.params.poolId))
    .map(m => ({ id: m.id, pool_id: m.poolId, user_id: m.userId, body: m.body, created_at: m.createdAt }));
  res.json({ data: items });
});

app.post('/api/messages', (req, res) => {
  const { pool_id, user_id, content } = req.body || {};
  const db = loadDB();
  const id = nextId(db);
  const msg = { id, poolId: String(pool_id), userId: String(user_id), body: String(content || ''), createdAt: new Date().toISOString() };
  db.messages.push(msg);
  saveDB(db);
  io.emit('message', { id: msg.id, poolId: msg.poolId, user_id: msg.userId, body: msg.body, created_at: msg.createdAt });
  res.json({ data: { id: msg.id } });
});

// Leaderboard (sum contributions per user for a pool)
app.get('/api/pools/:poolId/leaderboard', (req, res) => {
  const db = loadDB();
  const poolId = String(req.params.poolId);
  const sums = {};
  for (const c of db.contributions.filter(c => String(c.poolId) === poolId)) {
    sums[c.userId] = (sums[c.userId] || 0) + c.amountCents;
  }
  const rows = Object.entries(sums)
    .map(([userId, total]) => {
      const u = db.users.find(x => String(x.id) === String(userId));
      return { user_id: String(userId), name: u?.name || `User ${userId}`, total_cents: total };
    })
    .sort((a, b) => b.total_cents - a.total_cents);
  res.json(rows);
});

// Photo upload endpoint
app.put('/api/users/:id/photo', (req, res) => {
  const db = loadDB();
  const u = db.users.find(x => String(x.id) === String(req.params.id));
  if (!u) return res.status(404).json({ error: 'Not found' });
  const { profileImageUrl } = req.body || {};
  u.profile_image_url = profileImageUrl || u.profile_image_url;
  saveDB(db);
  res.json({ success: true });
});

// Privacy and notifications
app.get('/api/users/:id/privacy', (req, res) => {
  const db = loadDB();
  const settings = db.privacy[String(req.params.id)] || { isPublic: true, allowEncouragement: true };
  res.json(settings);
});
app.put('/api/users/:id/privacy', (req, res) => {
  const db = loadDB();
  db.privacy[String(req.params.id)] = { ...(db.privacy[String(req.params.id)] || {}), ...(req.body || {}) };
  saveDB(db);
  res.json({ success: true });
});
app.post('/api/users/:id/push-token', (req, res) => {
  const db = loadDB();
  const { pushToken } = req.body || {};
  db.notifications.tokens[String(req.params.id)] = pushToken || null;
  saveDB(db);
  res.json({ success: true });
});
app.post('/api/users/:id/notification-preferences', (req, res) => {
  const db = loadDB();
  db.notifications.preferences[String(req.params.id)] = req.body || {};
  saveDB(db);
  res.json({ success: true });
});
app.post('/api/notifications/send-test', (_req, res) => {
  res.json({ success: true, delivered: true });
});

// Penalty settings
app.get('/api/pools/:id/penalty-settings', (req, res) => {
  const db = loadDB();
  res.json(db.penaltySettings[String(req.params.id)] || { enabled: false });
});
app.put('/api/pools/:id/penalty-settings', (req, res) => {
  const db = loadDB();
  db.penaltySettings[String(req.params.id)] = req.body || {};
  saveDB(db);
  res.json({ success: true });
});

// Recurring payments
app.get('/api/pools/:poolId/users/:userId/recurring', (req, res) => {
  const db = loadDB();
  const r = db.recurring.find(x => String(x.poolId) === String(req.params.poolId) && String(x.userId) === String(req.params.userId));
  res.json(r?.settings || { enabled: false, amount_cents: 0, frequency: 'weekly' });
});
app.put('/api/pools/:poolId/users/:userId/recurring', (req, res) => {
  const db = loadDB();
  const idx = db.recurring.findIndex(x => String(x.poolId) === String(req.params.poolId) && String(x.userId) === String(req.params.userId));
  if (idx === -1) db.recurring.push({ poolId: String(req.params.poolId), userId: String(req.params.userId), settings: req.body || {} });
  else db.recurring[idx].settings = req.body || {};
  saveDB(db);
  res.json({ success: true });
});

// Encouragements and follows (light stubs)
app.post('/api/encouragement', (req, res) => {
  const db = loadDB();
  const item = { id: nextId(db), ...(req.body || {}), created_at: new Date().toISOString() };
  db.encouragements.push(item);
  saveDB(db);
  res.json({ success: true, id: item.id });
});
app.get('/api/users/:id/encouragements', (req, res) => {
  const db = loadDB();
  const items = db.encouragements.filter(e => String(e.toUserId) === String(req.params.id));
  res.json(items);
});
app.post('/api/users/:id/follow', (req, res) => {
  const db = loadDB();
  const { followerId } = req.body || {};
  db.follows.push({ userId: String(req.params.id), followerId: String(followerId) });
  saveDB(db);
  res.json({ success: true });
});
app.delete('/api/users/:id/follow', (req, res) => {
  const db = loadDB();
  const { followerId } = req.body || {};
  db.follows = db.follows.filter(f => !(String(f.userId) === String(req.params.id) && String(f.followerId) === String(followerId)));
  saveDB(db);
  res.json({ success: true });
});
app.get('/api/users/:id/follows', (req, res) => {
  const db = loadDB();
  const items = db.follows.filter(f => String(f.userId) === String(req.params.id));
  res.json(items);
});
app.get('/api/users/:id/feed', (req, res) => {
  const db = loadDB();
  const followees = db.follows.filter(f => String(f.followerId) === String(req.params.id)).map(f => String(f.userId));
  const items = db.contributions
    .filter(c => followees.includes(String(c.userId)))
    .slice(-50)
    .map(c => ({ type: 'contribution', user_id: c.userId, amount_cents: c.amountCents, created_at: c.createdAt }));
  res.json(items);
});

// Solo public pools
app.get('/api/pools/solo/public', (_req, res) => {
  const db = loadDB();
  const items = db.pools.filter(p => p.pool_type === 'solo' && p.public_visibility);
  res.json(items);
});

// Debit card APIs
app.post('/api/users/:userId/debit-card', (req, res) => {
  const db = loadDB();
  const userId = String(req.params.userId);
  const card = {
    userId,
    cardId: 'card_' + nextId(db),
    cardNumber: '4242 4242 4242 4242',
    expMonth: 12,
    expYear: 2030,
    cvv: '123',
    status: 'active'
  };
  db.cards = db.cards.filter(c => c.userId !== userId).concat(card);
  saveDB(db);
  res.json(card);
});
app.get('/api/users/:userId/debit-card', (req, res) => {
  const db = loadDB();
  const card = db.cards.find(c => c.userId === String(req.params.userId));
  res.json(card || null);
});
app.post('/api/debit-card/:cardId/transaction', (req, res) => {
  const db = loadDB();
  const { amountCents, merchant, category } = req.body || {};
  const id = nextId(db);
  const card = db.cards.find(c => c.cardId === String(req.params.cardId));
  if (!card) return res.status(404).json({ error: 'Card not found' });
  const tx = { id, userId: card.userId, cardId: card.cardId, amountCents: Number(amountCents) || 0, merchant: merchant || 'Merchant', category: category || 'general', created_at: new Date().toISOString() };
  db.cardTransactions.push(tx);
  saveDB(db);
  res.json({ success: true, id });
});
app.get('/api/users/:userId/card-transactions', (req, res) => {
  const db = loadDB();
  const items = db.cardTransactions.filter(t => String(t.userId) === String(req.params.userId)).slice(-50);
  res.json(items);
});
app.patch('/api/debit-card/:cardId/toggle', (req, res) => {
  const db = loadDB();
  const card = db.cards.find(c => c.cardId === String(req.params.cardId));
  if (!card) return res.status(404).json({ error: 'Card not found' });
  card.status = card.status === 'active' ? 'frozen' : 'active';
  saveDB(db);
  res.json({ status: card.status });
});

// Banking stubs used by services/banking.ts
app.post('/api/plaid/create-link-token', (_req, res) => {
  res.json({ link_token: 'mock-link-token' });
});
app.post('/api/plaid/exchange-token', (_req, res) => {
  res.json({ access_token: 'mock-access-token' });
});
app.get('/api/plaid/accounts', (_req, res) => {
  res.json({ accounts: [ { id: 'acc_1', name: 'Checking', type: 'checking', balance: 1250.55, account_id: 'acc_1' } ] });
});
app.get('/api/plaid/balance/:accountId', (req, res) => {
  res.json({ balance: 1234.56, account_id: String(req.params.accountId) });
});
app.post('/api/plaid/transactions', (_req, res) => {
  res.json({ transactions: [ { id: 't1', amount: -2500, date: new Date().toISOString().slice(0,10), description: 'Groceries', category: 'food' } ] });
});

app.post('/api/stripe/create-card', (_req, res) => {
  res.json({ card: { id: 'card_mock', number: '4242 4242 4242 4242', exp_month: 12, exp_year: 2030, cvc: '123', status: 'active' } });
});
app.post('/api/stripe/toggle-card', (req, res) => {
  res.json({ status: req.body?.freeze ? 'frozen' : 'active' });
});

app.post('/api/payments/contribute', (_req, res) => {
  res.json({ success: true });
});
app.post('/api/payments/withdraw', (_req, res) => {
  res.json({ success: true });
});
app.post('/api/payments/auto-contribute', (_req, res) => {
  res.json({ success: true });
});

// Socket.IO setup
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*'} });

io.on('connection', (socket) => {
  socket.on('room:join', (room) => {
    socket.join(String(room));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`PoolUp backend listening on http://localhost:${PORT} (LAN: http://192.168.5.97:${PORT})`);
});
