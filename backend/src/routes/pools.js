const express = require('express');
const { loadDB, saveDB, nextId } = require('../db/fileDb');

const router = express.Router();

router.get('/', (_req, res) => {
  const db = loadDB();
  const items = db.pools.map((p) => ({
    id: p.id,
    name: p.name,
    goal_amount: p.goal_cents,
    current_amount: p.saved_cents || 0,
    description: p.destination || null,
    created_by: p.creator_id,
  }));
  res.json({ data: items });
});

router.post('/', (req, res) => {
  const { name, description, goal_amount, target_date, created_by, pool_type, public_visibility } = req.body || {};
  const db = loadDB();
  // Respect 0 as a valid user id and fallback to header if not provided
  const createdByRaw = typeof created_by !== 'undefined' ? created_by : req.header('x-user-id');
  const createdByNum = Number(createdByRaw);
  const creatorId = Number.isFinite(createdByNum) ? createdByNum : 1;

  const pool = {
    id: nextId(db),
    name: name || 'Untitled',
    goal_cents: Number(goal_amount) || 0,
    saved_cents: 0,
    destination: description || null,
    trip_date: target_date || null,
    pool_type: pool_type || 'group',
    creator_id: creatorId,
    public_visibility: public_visibility ? 1 : 0,
    bonus_pot_cents: 0,
  };
  db.pools.push(pool);
  db.memberships.push({ poolId: pool.id, userId: String(pool.creator_id), role: 'owner' });
  saveDB(db);
  res.json({ data: pool });
});

router.get('/:id', (req, res) => {
  const db = loadDB();
  const p = db.pools.find((pp) => String(pp.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  const members = db.memberships
    .filter((m) => String(m.poolId) === String(p.id))
    .map((m) => {
      const u = db.users.find((x) => String(x.id) === String(m.userId));
      return { id: String(m.userId), name: u?.name || `User ${m.userId}`, role: m.role };
    });
  const contributions = db.contributions
    .filter((c) => String(c.poolId) === String(p.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({
      id: c.id,
      pool_id: String(c.poolId),
      user_id: String(c.userId),
      amount_cents: c.amountCents,
      created_at: c.createdAt,
      points_earned: c.points || 0,
      streak_bonus: c.streak > 1,
    }));

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
    contributions,
  });
});

router.get('/solo/public', (_req, res) => {
  const db = loadDB();
  const items = db.pools.filter((p) => p.pool_type === 'solo' && p.public_visibility);
  res.json(items);
});

router.get('/:id/penalty-settings', (req, res) => {
  const db = loadDB();
  res.json(db.penaltySettings[String(req.params.id)] || { enabled: false });
});

router.put('/:id/penalty-settings', (req, res) => {
  const db = loadDB();
  db.penaltySettings[String(req.params.id)] = req.body || {};
  saveDB(db);
  res.json({ success: true });
});

router.get('/:poolId/users/:userId/recurring', (req, res) => {
  const db = loadDB();
  const r = db.recurring.find(
    (x) => String(x.poolId) === String(req.params.poolId) && String(x.userId) === String(req.params.userId)
  );
  res.json(r?.settings || { enabled: false, amount_cents: 0, frequency: 'weekly' });
});

router.put('/:poolId/users/:userId/recurring', (req, res) => {
  const db = loadDB();
  const idx = db.recurring.findIndex(
    (x) => String(x.poolId) === String(req.params.poolId) && String(x.userId) === String(req.params.userId)
  );
  if (idx === -1) db.recurring.push({ poolId: String(req.params.poolId), userId: String(req.params.userId), settings: req.body || {} });
  else db.recurring[idx].settings = req.body || {};
  saveDB(db);
  res.json({ success: true });
});

// Original path: /api/pools/:poolId/messages
router.get('/:poolId/messages', (req, res) => {
  const db = loadDB();
  const items = db.messages
    .filter((m) => String(m.poolId) === String(req.params.poolId))
    .map((m) => ({ id: m.id, pool_id: m.poolId, user_id: m.userId, body: m.body, created_at: m.createdAt }));
  res.json(items);
});

router.get('/:poolId/leaderboard', (req, res) => {
  const db = loadDB();
  const poolId = String(req.params.poolId);
  const sums = {};
  for (const c of db.contributions.filter((c) => String(c.poolId) === poolId)) {
    sums[c.userId] = (sums[c.userId] || 0) + c.amountCents;
  }
  const rows = Object.entries(sums)
    .map(([userId, total]) => {
      const u = db.users.find((x) => String(x.id) === String(userId));
      return { user_id: String(userId), name: u?.name || `User ${userId}`, total_cents: total };
    })
    .sort((a, b) => b.total_cents - a.total_cents);
  res.json(rows);
});

module.exports = router;
