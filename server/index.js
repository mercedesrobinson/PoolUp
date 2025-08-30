import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import db from './db.js';
import { 
  calculatePoints, 
  updateUserStreak, 
  awardBadge, 
  createPoolChallenge, 
  createUnlockables, 
  updateLeaderboard, 
  initializeBadges,
  calculateInterest,
  processForfeit
} from './gamification.js';
import {
  createDebitCard,
  processTransaction,
  getCardTransactions,
  getSpendingInsights,
  toggleCardStatus,
  getTravelPerks
} from './debit-card.js';
import {
  createOrUpdateGoogleUser,
  createGuestUser,
  updateUserAvatar,
  getUserProfile,
  updateUserPrivacy
} from './auth.js';
import {
  AVATAR_OPTIONS,
  generateRandomAvatar,
  avatarToEmoji,
  avatarToSVG,
  getAvatarPresets
} from './avatar-builder.js';
import {
  createSoloPool,
  getPublicSoloPools,
  sendEncouragement,
  getUserEncouragements,
  followUser,
  unfollowUser,
  getUserFollows,
  getPublicActivityFeed,
  getStreakLeaderboard,
  logPublicActivity
} from './solo-savings.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.ORIGIN?.split(',') || "*", methods: ["GET","POST"] }
});

app.use(cors({ origin: process.env.ORIGIN?.split(',') || "*"}));
app.use(express.json());

// --- Authentication ---
app.post('/api/auth/guest', (req,res)=>{
  const { name } = req.body;
  if(!name) return res.status(400).json({error:"name required"});
  const userId = createGuestUser(name);
  const user = getUserProfile(userId);
  res.json(user);
});

app.post('/api/auth/google', (req,res)=>{
  const { googleProfile } = req.body;
  if(!googleProfile) return res.status(400).json({error:"googleProfile required"});
  const userId = createOrUpdateGoogleUser(googleProfile);
  const user = getUserProfile(userId);
  res.json(user);
});

// Avatar system
app.get('/api/avatar/options', (req,res)=>{
  res.json(AVATAR_OPTIONS);
});

app.get('/api/avatar/presets', (req,res)=>{
  res.json(getAvatarPresets());
});

app.post('/api/avatar/generate', (req,res)=>{
  const avatar = generateRandomAvatar();
  res.json({ avatar, emoji: avatarToEmoji(avatar), svg: avatarToSVG(avatar) });
});

app.put('/api/users/:userId/avatar', (req,res)=>{
  const { userId } = req.params;
  const { avatarType, avatarData, profileImageUrl } = req.body;
  updateUserAvatar(userId, avatarType, avatarData, profileImageUrl);
  res.json({ ok: true });
});

app.put('/api/users/:userId/privacy', (req,res)=>{
  const { userId } = req.params;
  const { isPublic, allowEncouragement } = req.body;
  updateUserPrivacy(userId, isPublic, allowEncouragement);
  res.json({ ok: true });
});

// Create a pool (group or solo)
app.post('/api/pools', (req,res)=>{
  const { ownerId, name, goalCents, destination, tripDate, poolType = 'group' } = req.body;
  if(!ownerId || !name || !goalCents) return res.status(400).json({error:"ownerId, name, goalCents required"});
  
  let poolId;
  if (poolType === 'solo') {
    poolId = createSoloPool(ownerId, name, goalCents, destination, tripDate);
    logPublicActivity(ownerId, 'solo_pool_created', { name, goalCents, destination });
  } else {
    poolId = uuid();
    db.prepare("INSERT INTO pools (id,name,goal_cents,owner_id,destination,trip_date,pool_type) VALUES (?,?,?,?,?,?,?)").run(poolId, name, goalCents, ownerId, destination, tripDate, poolType);
    db.prepare("INSERT INTO memberships (user_id,pool_id,role) VALUES (?,?,?)").run(ownerId, poolId, 'owner');
    createPoolChallenge(poolId);
    if (destination) createUnlockables(poolId, destination);
  }
  
  res.json({ id: poolId, name, goalCents, destination, tripDate, poolType });
});

// Solo savings endpoints
app.get('/api/pools/solo/public', (req,res)=>{
  const { limit = 20 } = req.query;
  const pools = getPublicSoloPools(parseInt(limit));
  res.json(pools);
});

app.get('/api/leaderboard/streaks', (req,res)=>{
  const { limit = 20 } = req.query;
  const leaderboard = getStreakLeaderboard(parseInt(limit));
  res.json(leaderboard);
});

// Encouragement system
app.post('/api/encouragement', (req,res)=>{
  const { fromUserId, toUserId, poolId, message, type } = req.body;
  if(!fromUserId || !toUserId || !message) return res.status(400).json({error:"fromUserId, toUserId, message required"});
  const encouragementId = sendEncouragement(fromUserId, toUserId, poolId, message, type);
  
  // Emit real-time notification
  io.emit('encouragement_received', { toUserId, fromUserId, message, poolId });
  
  res.json({ id: encouragementId });
});

app.get('/api/users/:userId/encouragements', (req,res)=>{
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  const encouragements = getUserEncouragements(userId, parseInt(limit));
  res.json(encouragements);
});

// Follow system
app.post('/api/users/:userId/follow', (req,res)=>{
  const { userId } = req.params;
  const { followerId } = req.body;
  if(!followerId) return res.status(400).json({error:"followerId required"});
  followUser(followerId, userId);
  res.json({ ok: true });
});

app.delete('/api/users/:userId/follow', (req,res)=>{
  const { userId } = req.params;
  const { followerId } = req.body;
  if(!followerId) return res.status(400).json({error:"followerId required"});
  unfollowUser(followerId, userId);
  res.json({ ok: true });
});

app.get('/api/users/:userId/follows', (req,res)=>{
  const { userId } = req.params;
  const follows = getUserFollows(userId);
  res.json(follows);
});

// Activity feed
app.get('/api/users/:userId/feed', (req,res)=>{
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  const feed = getPublicActivityFeed(userId, parseInt(limit));
  res.json(feed);
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
  const { userId, amountCents, paymentMethod = 'manual' } = req.body;
  if(!userId || !amountCents) return res.status(400).json({error:"userId, amountCents required"});
  
  // Update streak and calculate points
  const streak = updateUserStreak(userId, poolId);
  const isEarly = new Date().getDay() < 3; // Before Wednesday
  const points = calculateContributionPoints(amountCents, streak > 1, isEarly);
  
  const id = uuid();
  db.prepare(`
    INSERT INTO contributions (id,pool_id,user_id,amount_cents,payment_method,points_earned,streak_bonus) 
    VALUES (?,?,?,?,?,?,?)
  `).run(id, poolId, userId, amountCents, paymentMethod, points, streak > 1);
  
  // Update user points and membership
  db.prepare('UPDATE users SET total_points = total_points + ?, xp = xp + ? WHERE id = ?').run(points, points, userId);
  db.prepare('UPDATE memberships SET total_contributed_cents = total_contributed_cents + ? WHERE user_id = ? AND pool_id = ?').run(amountCents, userId, poolId);
  
  // Check for new badges and update leaderboard
  const newBadges = checkAndAwardBadges(userId, poolId);
  updateLeaderboard(poolId);
  
  const payload = { id, poolId, userId, amountCents, points, streak, newBadges };
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

// === GAMIFICATION ENDPOINTS ===

// Get user profile with gamification stats
app.get('/api/users/:userId/profile', (req, res) => {
  const { userId } = req.params;
  const user = db.prepare(`
    SELECT u.*, 
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
      (SELECT COUNT(*) FROM contributions WHERE user_id = u.id) as total_contributions
    FROM users u WHERE id = ?
  `).get(userId);
  
  const badges = db.prepare(`
    SELECT b.* FROM badges b 
    JOIN user_badges ub ON b.id = ub.badge_id 
    WHERE ub.user_id = ?
  `).all(userId);
  
  res.json({ ...user, badges });
});

// Get user badges
app.get('/api/users/:userId/badges', (req, res) => {
  const { userId } = req.params;
  const badges = db.prepare(`
    SELECT b.*, ub.earned_at FROM badges b 
    JOIN user_badges ub ON b.id = ub.badge_id 
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at DESC
  `).all(userId);
  res.json(badges);
});

// Get leaderboard for pool
app.get('/api/pools/:poolId/leaderboard', (req, res) => {
  const { poolId } = req.params;
  const leaderboard = db.prepare(`
    SELECT u.id, u.name, u.avatar, le.points, le.rank, m.contribution_streak, m.total_contributed_cents
    FROM leaderboard_entries le
    JOIN users u ON le.user_id = u.id
    JOIN memberships m ON u.id = m.user_id AND m.pool_id = le.pool_id
    WHERE le.pool_id = ?
    ORDER BY le.rank ASC
  `).all(poolId);
  res.json(leaderboard);
});

// Get pool challenges
app.get('/api/pools/:poolId/challenges', (req, res) => {
  const { poolId } = req.params;
  const challenges = db.prepare('SELECT * FROM challenges WHERE pool_id = ? ORDER BY end_date ASC').all(poolId);
  res.json(challenges);
});

// Get pool unlockables
app.get('/api/pools/:poolId/unlockables', (req, res) => {
  const { poolId } = req.params;
  const pool = db.prepare('SELECT goal_cents FROM pools WHERE id = ?').get(poolId);
  const saved = db.prepare('SELECT COALESCE(SUM(amount_cents),0) as total FROM contributions WHERE pool_id = ?').get(poolId);
  const progress = Math.floor((saved.total / pool.goal_cents) * 100);
  
  const unlockables = db.prepare('SELECT * FROM unlockables WHERE pool_id = ? ORDER BY unlock_percentage ASC').all(poolId);
  
  // Update unlocked status
  unlockables.forEach(item => {
    if (progress >= item.unlock_percentage && !item.is_unlocked) {
      db.prepare('UPDATE unlockables SET is_unlocked = TRUE, unlocked_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.id);
      item.is_unlocked = true;
    }
  });
  
  res.json({ unlockables, progress });
});

// === DEBIT CARD ENDPOINTS ===

// Create debit card
app.post('/api/users/:userId/debit-card', (req, res) => {
  const { userId } = req.params;
  const { cardHolderName } = req.body;
  if (!cardHolderName) return res.status(400).json({ error: 'cardHolderName required' });
  
  try {
    const card = createDebitCard(userId, cardHolderName);
    res.json(card);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get card details
app.get('/api/users/:userId/debit-card', (req, res) => {
  const { userId } = req.params;
  const card = getCardDetails(userId);
  res.json(card);
});

// Process card transaction
app.post('/api/debit-card/:cardId/transaction', (req, res) => {
  const { cardId } = req.params;
  const { amountCents, merchant, category } = req.body;
  if (!amountCents || !merchant) return res.status(400).json({ error: 'amountCents and merchant required' });
  
  try {
    const transaction = processCardTransaction(cardId, amountCents, merchant, category);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get card transactions
app.get('/api/users/:userId/card-transactions', (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  const transactions = getCardTransactions(userId, parseInt(limit));
  res.json(transactions);
});

// Get travel perks
app.get('/api/users/:userId/travel-perks', (req, res) => {
  const { userId } = req.params;
  const perks = getTravelPerks(userId);
  res.json(perks);
});

// Get spending insights
app.get('/api/users/:userId/spending-insights', (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;
  const insights = getSpendingInsights(userId, parseInt(days));
  res.json(insights);
});

// Toggle card status
app.patch('/api/debit-card/:cardId/toggle', (req, res) => {
  const { cardId } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  try {
    const result = toggleCardStatus(cardId, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process forfeit
app.post('/api/pools/:poolId/forfeit', (req, res) => {
  const { poolId } = req.params;
  const { userId, reason, amount = 500 } = req.body;
  if (!userId || !reason) return res.status(400).json({ error: 'userId and reason required' });
  
  const forfeitId = processForfeit(userId, poolId, reason, amount);
  io.to(poolId).emit('forfeit:new', { forfeitId, userId, poolId, reason, amount });
  res.json({ forfeitId, amount });
});

// Peer boost (cover someone's payment)
app.post('/api/pools/:poolId/peer-boost', (req, res) => {
  const { poolId } = req.params;
  const { boosterUserId, targetUserId, amountCents } = req.body;
  if (!boosterUserId || !targetUserId || !amountCents) {
    return res.status(400).json({ error: 'boosterUserId, targetUserId, and amountCents required' });
  }
  
  // Create contribution on behalf of target user
  const id = uuid();
  const points = calculateContributionPoints(amountCents) * 1.5; // Bonus points for helping
  
  db.prepare(`
    INSERT INTO contributions (id,pool_id,user_id,amount_cents,payment_method,points_earned) 
    VALUES (?,?,?,?,?,?)
  `).run(id, poolId, targetUserId, amountCents, 'peer_boost', 0);
  
  // Give bonus points to booster
  db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(points, boosterUserId);
  
  const newBadges = checkAndAwardBadges(boosterUserId, poolId);
  updateLeaderboard(poolId);
  
  const payload = { id, poolId, boosterUserId, targetUserId, amountCents, points, newBadges };
  io.to(poolId).emit('peer_boost:new', payload);
  res.json(payload);
});

// Calculate daily interest
app.post('/api/users/:userId/calculate-interest', (req, res) => {
  const { userId } = req.params;
  const user = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const earnings = calculateInterestEarnings(userId, user.balance_cents);
  res.json({ dailyEarnings: earnings, newBalance: user.balance_cents + earnings });
});

// --- Socket.IO rooms for real-time updates ---
io.on('connection', (socket)=>{
  socket.on('room:join', (poolId)=>{
    socket.join(poolId);
  });
});

// Initialize gamification system on startup
initializeGamification();

const port = process.env.PORT || 4000;
httpServer.listen(port, ()=> console.log(`server on http://localhost:${port}`));
