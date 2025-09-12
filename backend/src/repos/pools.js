const { query } = require('../db/pg');

async function listPools() {
  const { rows } = await query('SELECT id, name, goal_cents, saved_cents, destination, creator_id FROM pools ORDER BY id');
  return rows.map((p) => ({
    id: String(p.id),
    name: p.name,
    goal_amount: p.goal_cents,
    current_amount: p.saved_cents || 0,
    description: p.destination || null,
    created_by: p.creator_id,
  }));
}

async function createPool({ name, description, goal_amount, target_date, created_by, pool_type = 'group', public_visibility = false }) {
  const { rows } = await query(
    `INSERT INTO pools (name, goal_cents, destination, trip_date, pool_type, creator_id, public_visibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, name, goal_cents, saved_cents, destination, trip_date, pool_type, creator_id, public_visibility, bonus_pot_cents`,
    [name || 'Untitled', Number(goal_amount) || 0, description || null, target_date || null, pool_type, created_by, public_visibility ? true : false]
  );
  const pool = rows[0];
  // Add owner membership
  await query('INSERT INTO memberships (pool_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [pool.id, created_by, 'owner']);
  return pool;
}

async function getPoolById(id) {
  const { rows } = await query('SELECT * FROM pools WHERE id = $1', [id]);
  const p = rows[0];
  if (!p) return null;
  const membersRes = await query(
    `SELECT m.user_id, m.role, u.name, u.profile_image_url
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.pool_id = $1`,
    [id]
  );
  const members = membersRes.rows.map((m) => ({ id: String(m.user_id), name: m.name, role: m.role }));
  const contribRes = await query(
    `SELECT id, pool_id, user_id, amount_cents, created_at, points, streak FROM contributions
     WHERE pool_id = $1 ORDER BY created_at DESC`,
    [id]
  );
  const contributions = contribRes.rows.map((c) => ({
    id: String(c.id),
    pool_id: String(c.pool_id),
    user_id: String(c.user_id),
    amount_cents: c.amount_cents,
    created_at: c.created_at,
    points_earned: c.points || 0,
    streak_bonus: (c.streak || 0) > 1,
  }));
  return {
    id: String(p.id),
    name: p.name,
    goal_cents: p.goal_cents,
    saved_cents: p.saved_cents || 0,
    destination: p.destination,
    trip_date: p.trip_date,
    pool_type: p.pool_type || 'group',
    bonus_pot_cents: p.bonus_pot_cents || 0,
    members,
    contributions,
  };
}

async function listSoloPublic() {
  const { rows } = await query('SELECT * FROM pools WHERE pool_type = $1 AND public_visibility = true', ['solo']);
  return rows;
}

async function getPenaltySettings(poolId) {
  const { rows } = await query('SELECT settings FROM penalty_settings WHERE pool_id = $1', [poolId]);
  return rows[0]?.settings || { enabled: false };
}

async function setPenaltySettings(poolId, settings) {
  await query(
    'INSERT INTO penalty_settings (pool_id, settings) VALUES ($1,$2) ON CONFLICT (pool_id) DO UPDATE SET settings = EXCLUDED.settings',
    [poolId, settings]
  );
}

async function getUserRecurring(poolId, userId) {
  const { rows } = await query('SELECT settings FROM recurring WHERE pool_id = $1 AND user_id = $2', [poolId, userId]);
  return rows[0]?.settings || { enabled: false, amount_cents: 0, frequency: 'weekly' };
}

async function setUserRecurring(poolId, userId, settings) {
  await query(
    'INSERT INTO recurring (pool_id, user_id, settings) VALUES ($1,$2,$3) ON CONFLICT (pool_id,user_id) DO UPDATE SET settings = EXCLUDED.settings',
    [poolId, userId, settings]
  );
}

async function listMessages(poolId) {
  const { rows } = await query('SELECT id, pool_id, user_id, body, created_at FROM messages WHERE pool_id = $1 ORDER BY created_at', [poolId]);
  return rows.map((m) => ({ id: String(m.id), pool_id: String(m.pool_id), user_id: String(m.user_id), body: m.body, created_at: m.created_at }));
}

async function leaderboard(poolId) {
  const { rows } = await query(
    `SELECT c.user_id, SUM(c.amount_cents)::int AS total_cents, COALESCE(u.name, CONCAT('User ', c.user_id::text)) AS name
     FROM contributions c LEFT JOIN users u ON u.id = c.user_id
     WHERE c.pool_id = $1 GROUP BY c.user_id, u.name ORDER BY total_cents DESC`,
    [poolId]
  );
  return rows.map((r) => ({ user_id: String(r.user_id), name: r.name, total_cents: r.total_cents }));
}

async function listUserPools(userId) {
  const { rows } = await query(
    `SELECT p.id, p.name, p.goal_cents, p.saved_cents, p.destination, p.creator_id
     FROM memberships m JOIN pools p ON p.id = m.pool_id
     WHERE m.user_id = $1`,
    [userId]
  );
  return rows.map((p) => ({ id: String(p.id), name: p.name, goal_cents: p.goal_cents, saved_cents: p.saved_cents || 0, destination: p.destination, creator_id: p.creator_id }));
}

module.exports = {
  listPools,
  createPool,
  getPoolById,
  listSoloPublic,
  getPenaltySettings,
  setPenaltySettings,
  getUserRecurring,
  setUserRecurring,
  listMessages,
  leaderboard,
  listUserPools,
};

