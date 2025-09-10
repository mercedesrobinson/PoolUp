const express = require('express');
const { loadDB, saveDB, nextId } = require('../db/fileDb');

const router = express.Router();

router.post('/', (req, res) => {
  const { google_id, name, email, profile_image_url } = req.body || {};
  const db = loadDB();
  const user = {
    id: nextId(db),
    google_id: google_id || null,
    name: name || 'User',
    email: email || null,
    profile_image_url: profile_image_url || null,
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB(db);
  res.json({ data: user });
});

router.get('/:id/profile', (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  const contributions = db.contributions.filter((c) => String(c.userId) === String(user.id));
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
    profile_image_url: user.profile_image_url || null,
  });
});

router.get('/:id/streak', (req, res) => {
  const db = loadDB();
  const userId = String(req.params.id);
  const contributions = db.contributions.filter((c) => String(c.userId) === userId);
  const currentStreak = Math.min(30, contributions.length);
  res.json({
    current_streak: currentStreak,
    longest_streak: currentStreak,
    last_contribution_date: contributions.length > 0 ? contributions[contributions.length - 1].createdAt : null,
  });
});

router.put('/:id/photo', (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => String(x.id) === String(req.params.id));
  if (!u) return res.status(404).json({ error: 'Not found' });
  const { profileImageUrl } = req.body || {};
  u.profile_image_url = profileImageUrl || u.profile_image_url;
  saveDB(db);
  res.json({ success: true });
});

router.get('/:id/privacy', (req, res) => {
  const db = loadDB();
  const settings = db.privacy[String(req.params.id)] || { isPublic: true, allowEncouragement: true };
  res.json(settings);
});

router.put('/:id/privacy', (req, res) => {
  const db = loadDB();
  db.privacy[String(req.params.id)] = { ...(db.privacy[String(req.params.id)] || {}), ...(req.body || {}) };
  saveDB(db);
  res.json({ success: true });
});

router.post('/:id/push-token', (req, res) => {
  const db = loadDB();
  const { pushToken } = req.body || {};
  db.notifications.tokens[String(req.params.id)] = pushToken || null;
  saveDB(db);
  res.json({ success: true });
});

router.post('/:id/notification-preferences', (req, res) => {
  const db = loadDB();
  db.notifications.preferences[String(req.params.id)] = req.body || {};
  saveDB(db);
  res.json({ success: true });
});

router.post('/:id/follow', (req, res) => {
  const db = loadDB();
  const { followerId } = req.body || {};
  db.follows.push({ userId: String(req.params.id), followerId: String(followerId) });
  saveDB(db);
  res.json({ success: true });
});

router.delete('/:id/follow', (req, res) => {
  const db = loadDB();
  const { followerId } = req.body || {};
  db.follows = db.follows.filter(
    (f) => !(String(f.userId) === String(req.params.id) && String(f.followerId) === String(followerId))
  );
  saveDB(db);
  res.json({ success: true });
});

router.get('/:id/follows', (req, res) => {
  const db = loadDB();
  const items = db.follows.filter((f) => String(f.userId) === String(req.params.id));
  res.json(items);
});

router.get('/:id/feed', (req, res) => {
  const db = loadDB();
  const followees = db.follows.filter((f) => String(f.followerId) === String(req.params.id)).map((f) => String(f.userId));
  const items = db.contributions
    .filter((c) => followees.includes(String(c.userId)))
    .slice(-20)
    .map((c) => ({ ...c, type: 'contribution' }));
  res.json(items);
});

router.get('/:id/friends-feed', (req, res) => {
  const db = loadDB();
  const userId = String(req.params.id);
  const filter = req.query.filter || 'all';

  const followees = db.follows.filter((f) => String(f.followerId) === userId).map((f) => String(f.userId));
  const userPoolIds = db.memberships.filter((m) => String(m.userId) === userId).map((m) => String(m.poolId));
  const groupMembers = db.memberships
    .filter((m) => userPoolIds.includes(String(m.poolId)) && String(m.userId) !== userId)
    .map((m) => String(m.userId));

  let relevantUserIds = [];
  if (filter === 'friends') relevantUserIds = followees;
  else if (filter === 'groups') relevantUserIds = groupMembers;
  else relevantUserIds = [...new Set([...followees, ...groupMembers])];

  const activities = [];

  db.contributions
    .filter((c) => relevantUserIds.includes(String(c.userId)))
    .slice(-20)
    .forEach((contribution) => {
      const user = db.users.find((u) => String(u.id) === String(contribution.userId));
      const pool = db.pools.find((p) => String(p.id) === String(contribution.poolId));
      if (user && pool) {
        activities.push({
          id: `contrib_${contribution.id}`,
          type: 'contribution',
          user: { name: user.name, photo: user.profile_image_url },
          pool: { name: pool.name, destination: pool.destination },
          amount: contribution.amountCents,
          timestamp: contribution.createdAt,
          isPublic: true,
        });
      }
    });

  db.pools
    .filter((p) => relevantUserIds.includes(String(p.creator_id)))
    .slice(-10)
    .forEach((pool) => {
      const user = db.users.find((u) => String(u.id) === String(pool.creator_id));
      if (user) {
        activities.push({
          id: `pool_${pool.id}`,
          type: 'goal_created',
          user: { name: user.name, photo: user.profile_image_url },
          pool: { name: pool.name, destination: pool.destination },
          timestamp: pool.created_at || new Date().toISOString(),
          isPublic: true,
        });
      }
    });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(activities.slice(0, 20));
});

// Original path: /api/users/:id/pools
router.get('/:id/pools', (req, res) => {
  const db = loadDB();
  const userId = String(req.params.id);
  const poolIds = db.memberships.filter((m) => String(m.userId) === userId).map((m) => String(m.poolId));
  const items = db.pools
    .filter((p) => poolIds.includes(String(p.id)))
    .map((p) => ({
      id: p.id,
      name: p.name,
      goal_cents: p.goal_cents,
      saved_cents: p.saved_cents || 0,
      destination: p.destination,
      creator_id: p.creator_id,
    }));
  res.json(items);
});

router.post('/encouragement', (req, res) => {
  const db = loadDB();
  const item = { id: nextId(db), ...(req.body || {}), created_at: new Date().toISOString() };
  db.encouragements.push(item);
  saveDB(db);
  res.json({ success: true, id: item.id });
});

router.get('/:id/encouragements', (req, res) => {
  const db = loadDB();
  const items = db.encouragements.filter((e) => String(e.toUserId) === String(req.params.id));
  res.json(items);
});

router.post('/notifications/send-test', (_req, res) => {
  res.json({ success: true, delivered: true });
});

module.exports = router;
