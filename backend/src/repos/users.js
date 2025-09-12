const { query } = require('../db/pg');

async function createUser({ google_id = null, name = 'User', email = null, profile_image_url = null, password_hash = null }) {
  const { rows } = await query(
    `INSERT INTO users (google_id, name, email, profile_image_url, password_hash)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, email, profile_image_url`,
    [google_id, name, email, profile_image_url, password_hash]
  );
  return rows[0];
}

async function getUserById(id) {
  const { rows } = await query('SELECT id, name, email, profile_image_url FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const { rows } = await query('SELECT id, name, email, profile_image_url FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] || null;
}

async function getUserWithSecretByEmail(email) {
  const { rows } = await query('SELECT id, name, email, profile_image_url, password_hash FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] || null;
}

async function upsertByEmail({ name, email, profile_image_url = null }) {
  const existing = await getUserByEmail(email);
  if (existing) return existing;
  return await createUser({ name, email, profile_image_url });
}

async function updatePhoto(id, profile_image_url) {
  await query('UPDATE users SET profile_image_url = $2 WHERE id = $1', [id, profile_image_url]);
}

async function getProfileStats(id) {
  const userRes = await query('SELECT id, name, email, profile_image_url FROM users WHERE id = $1', [id]);
  if (!userRes.rowCount) return null;
  const user = userRes.rows[0];
  const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM contributions WHERE user_id = $1', [id]);
  const count = rows[0]?.cnt || 0;
  const totalPoints = Math.min(1000, count * 10);
  const streak = Math.min(30, count);
  const badges = Math.floor(count / 5);
  return {
    id: String(user.id),
    name: user.name,
    xp: totalPoints,
    total_points: totalPoints,
    current_streak: streak,
    badge_count: badges,
    profile_image_url: user.profile_image_url || null,
  };
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUserWithSecretByEmail,
  upsertByEmail,
  updatePhoto,
  getProfileStats,
};
