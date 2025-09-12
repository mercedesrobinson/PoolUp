const { query } = require('../db/pg');

async function listByPool(poolId) {
  const { rows } = await query('SELECT id, pool_id, user_id, body, created_at FROM messages WHERE pool_id = $1 ORDER BY created_at', [poolId]);
  return rows.map((m) => ({ id: String(m.id), pool_id: String(m.pool_id), user_id: String(m.user_id), body: m.body, created_at: m.created_at }));
}

async function createMessage({ pool_id, user_id, content }) {
  const { rows } = await query(
    'INSERT INTO messages (pool_id, user_id, body) VALUES ($1,$2,$3) RETURNING id',
    [pool_id, user_id, String(content || '')]
  );
  return { id: String(rows[0].id) };
}

module.exports = { listByPool, createMessage };

