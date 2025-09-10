const express = require('express');
const { loadDB, saveDB, nextId } = require('../db/fileDb');
const { getIO } = require('../sockets/io');

const router = express.Router();

router.post('/', (req, res) => {
  const { pool_id, user_id, amount, description } = req.body || {};
  const db = loadDB();
  const pool = db.pools.find((p) => String(p.id) === String(pool_id));
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  const id = nextId(db);
  const contribution = {
    id,
    poolId: String(pool_id),
    userId: String(user_id),
    amountCents: Number(amount) || 0,
    description: description || 'manual',
    createdAt: new Date().toISOString(),
  };
  db.contributions.push(contribution);
  pool.saved_cents = (pool.saved_cents || 0) + contribution.amountCents;

  const userContribs = db.contributions.filter((c) => String(c.userId) === String(user_id));
  const points = Math.max(5, Math.round(contribution.amountCents / 100));
  const streak = Math.min(30, userContribs.length);
  const newBadges = userContribs.length % 5 === 0 ? [{ id: 'badge_saver', name: 'Consistent Saver' }] : [];

  saveDB(db);
  const io = getIO();
  if (io) io.to(String(pool_id)).emit('contribution:new', { poolId: String(pool_id), contribution: { id, amountCents: contribution.amountCents }, newBadges });
  res.json({ success: true, points, streak, newBadges });
});

module.exports = router;

