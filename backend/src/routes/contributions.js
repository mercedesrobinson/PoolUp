const express = require('express');
const { getIO } = require('../sockets/io');
const contributionsRepo = require('../repos/contributions');

const router = express.Router();

router.post('/', async (req, res) => {
  const { pool_id, user_id, amount, description } = req.body || {};
  const amount_cents = Number(amount) || 0;
  const { id, points, streak } = await contributionsRepo.addContribution({ pool_id, user_id, amount_cents, description });
  const newBadges = streak % 5 === 0 ? [{ id: 'badge_saver', name: 'Consistent Saver' }] : [];
  const io = getIO();
  if (io) io.to(String(pool_id)).emit('contribution:new', { poolId: String(pool_id), contribution: { id, amountCents: amount_cents }, newBadges });
  res.json({ success: true, points, streak, newBadges });
});

module.exports = router;
