const { query } = require('../db/pg');

async function follow(userId, followerId) {
  await query('INSERT INTO follows (user_id, follower_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, followerId]);
}

async function unfollow(userId, followerId) {
  await query('DELETE FROM follows WHERE user_id = $1 AND follower_id = $2', [userId, followerId]);
}

async function listFollows(userId) {
  const { rows } = await query('SELECT user_id, follower_id FROM follows WHERE user_id = $1', [userId]);
  return rows.map((r) => ({ userId: String(r.user_id), followerId: String(r.follower_id) }));
}

async function listFolloweesOf(followerId) {
  const { rows } = await query('SELECT user_id FROM follows WHERE follower_id = $1', [followerId]);
  return rows.map((r) => String(r.user_id));
}

module.exports = { follow, unfollow, listFollows, listFolloweesOf };

