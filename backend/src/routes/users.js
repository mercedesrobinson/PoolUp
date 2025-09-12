const express = require('express');
const usersRepo = require('../repos/users');
const poolsRepo = require('../repos/pools');
const socialRepo = require('../repos/social');
const settingsRepo = require('../repos/settings');

const router = express.Router();

router.post('/', async (req, res) => {
  const { google_id, name, email, profile_image_url } = req.body || {};
  const user = await usersRepo.createUser({ google_id, name, email, profile_image_url });
  res.json({ data: user });
});

router.get('/:id/profile', async (req, res) => {
  const stats = await usersRepo.getProfileStats(req.params.id);
  if (!stats) return res.status(404).json({ error: 'Not found' });
  res.json(stats);
});

router.get('/:id/streak', async (req, res) => {
  // Approximate streak based on total contributions count
  const stats = await usersRepo.getProfileStats(req.params.id);
  if (!stats) return res.status(404).json({ error: 'Not found' });
  res.json({ current_streak: stats.current_streak, longest_streak: stats.current_streak, last_contribution_date: null });
});

router.put('/:id/photo', async (req, res) => {
  const { profileImageUrl } = req.body || {};
  await usersRepo.updatePhoto(req.params.id, profileImageUrl || null);
  res.json({ success: true });
});

router.get('/:id/privacy', async (req, res) => {
  const settings = await settingsRepo.getPrivacy(req.params.id);
  res.json({ isPublic: !!settings.is_public, allowEncouragement: !!settings.allow_encouragement });
});

router.put('/:id/privacy', async (req, res) => {
  await settingsRepo.setPrivacy(req.params.id, req.body || {});
  res.json({ success: true });
});

router.post('/:id/push-token', async (req, res) => {
  const { pushToken } = req.body || {};
  await settingsRepo.setPushToken(req.params.id, pushToken || null);
  res.json({ success: true });
});

router.post('/:id/notification-preferences', async (req, res) => {
  await settingsRepo.setNotificationPreferences(req.params.id, req.body || {});
  res.json({ success: true });
});

router.post('/:id/follow', async (req, res) => {
  const { followerId } = req.body || {};
  await socialRepo.follow(req.params.id, followerId);
  res.json({ success: true });
});

router.delete('/:id/follow', async (req, res) => {
  const { followerId } = req.body || {};
  await socialRepo.unfollow(req.params.id, followerId);
  res.json({ success: true });
});

router.get('/:id/follows', async (req, res) => {
  const items = await socialRepo.listFollows(req.params.id);
  res.json(items);
});

router.get('/:id/feed', async (req, res) => {
  const userId = String(req.params.id);
  const followees = await socialRepo.listFolloweesOf(userId);
  const { rows } = await require('../db/pg').query(
    'SELECT * FROM contributions WHERE user_id = ANY($1) ORDER BY created_at DESC LIMIT 20',
    [followees]
  );
  const items = rows.map((c) => ({ id: String(c.id), poolId: String(c.pool_id), userId: String(c.user_id), amountCents: c.amount_cents, description: c.description, createdAt: c.created_at, type: 'contribution' }));
  res.json(items);
});

router.get('/:id/friends-feed', async (req, res) => {
  const userId = String(req.params.id);
  const filter = req.query.filter || 'all';
  const followees = await socialRepo.listFolloweesOf(userId);
  const { rows: userPools } = await require('../db/pg').query('SELECT pool_id FROM memberships WHERE user_id = $1', [userId]);
  const userPoolIds = userPools.map((r) => String(r.pool_id));
  const { rows: groupMembersRows } = await require('../db/pg').query(
    'SELECT DISTINCT user_id FROM memberships WHERE pool_id = ANY($1) AND user_id <> $2',
    [userPoolIds, userId]
  );
  const groupMembers = groupMembersRows.map((r) => String(r.user_id));

  let relevantUserIds = [];
  if (filter === 'friends') relevantUserIds = followees;
  else if (filter === 'groups') relevantUserIds = groupMembers;
  else relevantUserIds = Array.from(new Set([...followees, ...groupMembers]));

  const activities = [];
  const { rows: contribs } = await require('../db/pg').query(
    'SELECT c.*, u.name, u.profile_image_url, p.name AS pool_name, p.destination FROM contributions c JOIN users u ON u.id = c.user_id JOIN pools p ON p.id = c.pool_id WHERE c.user_id = ANY($1) ORDER BY c.created_at DESC LIMIT 20',
    [relevantUserIds]
  );
  for (const c of contribs) {
    activities.push({
      id: `contrib_${c.id}`,
      type: 'contribution',
      user: { name: c.name, photo: c.profile_image_url },
      pool: { name: c.pool_name, destination: c.destination },
      amount: c.amount_cents,
      timestamp: c.created_at,
      isPublic: true,
    });
  }

  const { rows: poolsCreated } = await require('../db/pg').query(
    'SELECT p.*, u.name, u.profile_image_url FROM pools p JOIN users u ON u.id = p.creator_id WHERE p.creator_id = ANY($1) ORDER BY p.created_at DESC LIMIT 10',
    [relevantUserIds]
  );
  for (const p of poolsCreated) {
    activities.push({
      id: `pool_${p.id}`,
      type: 'goal_created',
      user: { name: p.name, photo: p.profile_image_url },
      pool: { name: p.name, destination: p.destination },
      timestamp: p.created_at,
      isPublic: true,
    });
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(activities.slice(0, 20));
});

// Original path: /api/users/:id/pools
router.get('/:id/pools', async (req, res) => {
  const items = await poolsRepo.listUserPools(req.params.id);
  res.json(items);
});

router.post('/encouragement', async (req, res) => {
  const { rows } = await require('../db/pg').query(
    'INSERT INTO encouragements (to_user_id, from_user_id, message) VALUES ($1,$2,$3) RETURNING id',
    [req.body?.toUserId || null, req.body?.fromUserId || null, req.body?.message || null]
  );
  res.json({ success: true, id: String(rows[0].id) });
});

router.get('/:id/encouragements', async (req, res) => {
  const { rows } = await require('../db/pg').query('SELECT * FROM encouragements WHERE to_user_id = $1', [req.params.id]);
  res.json(rows);
});

router.post('/notifications/send-test', (_req, res) => {
  res.json({ success: true, delivered: true });
});

module.exports = router;
