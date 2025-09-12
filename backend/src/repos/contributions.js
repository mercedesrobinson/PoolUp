const { query } = require('../db/pg');

async function addContribution({ pool_id, user_id, amount_cents, description }) {
  // Update pool saved_cents and insert contribution
  const now = new Date();
  const contribRes = await query(
    `INSERT INTO contributions (pool_id, user_id, amount_cents, description)
     VALUES ($1,$2,$3,$4)
     RETURNING id, created_at`,
    [pool_id, user_id, amount_cents, description || 'manual']
  );
  await query('UPDATE pools SET saved_cents = COALESCE(saved_cents,0) + $2 WHERE id = $1', [pool_id, amount_cents]);
  // Compute points/streak
  const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM contributions WHERE user_id = $1', [user_id]);
  const count = rows[0]?.cnt || 0;
  const points = Math.max(5, Math.round(amount_cents / 100));
  const streak = Math.min(30, count);
  await query('UPDATE contributions SET points = $2, streak = $3 WHERE id = $1', [contribRes.rows[0].id, points, streak]);
  return { id: String(contribRes.rows[0].id), points, streak, created_at: contribRes.rows[0].created_at };
}

module.exports = { addContribution };

