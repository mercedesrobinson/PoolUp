const express = require('express');
const poolsRepo = require('../repos/pools');
const { query } = require('../db/pg');

const router = express.Router();

router.get('/', async (_req, res) => {
  const items = await poolsRepo.listPools();
  res.json({ data: items });
});

router.post('/', async (req, res) => {
  const { name, description, goal_amount, target_date, created_by, pool_type, public_visibility } = req.body || {};
  const createdByRaw = typeof created_by !== 'undefined' ? created_by : req.header('x-user-id');
  const createdByNum = Number(createdByRaw);
  const creatorId = Number.isFinite(createdByNum) ? createdByNum : 1;
  const pool = await poolsRepo.createPool({ name, description, goal_amount, target_date, created_by: creatorId, pool_type, public_visibility });
  res.json({ data: pool });
});

router.get('/:id', async (req, res) => {
  const data = await poolsRepo.getPoolById(req.params.id);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.get('/solo/public', async (_req, res) => {
  const items = await poolsRepo.listSoloPublic();
  res.json(items);
});

router.get('/:id/penalty-settings', async (req, res) => {
  const s = await poolsRepo.getPenaltySettings(req.params.id);
  res.json(s);
});

router.put('/:id/penalty-settings', async (req, res) => {
  await poolsRepo.setPenaltySettings(req.params.id, req.body || {});
  res.json({ success: true });
});

router.get('/:poolId/users/:userId/recurring', async (req, res) => {
  const s = await poolsRepo.getUserRecurring(req.params.poolId, req.params.userId);
  res.json(s);
});

router.put('/:poolId/users/:userId/recurring', async (req, res) => {
  await poolsRepo.setUserRecurring(req.params.poolId, req.params.userId, req.body || {});
  res.json({ success: true });
});

// Original path: /api/pools/:poolId/messages
router.get('/:poolId/messages', async (req, res) => {
  const items = await poolsRepo.listMessages(req.params.poolId);
  res.json(items);
});

router.get('/:poolId/leaderboard', async (req, res) => {
  const rows = await poolsRepo.leaderboard(req.params.poolId);
  res.json(rows);
});

module.exports = router;
