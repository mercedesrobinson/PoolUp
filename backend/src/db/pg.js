const { Pool } = require('pg');
const { DATABASE_URL } = require('../config/env');

function buildConfig() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const cfg = { connectionString: DATABASE_URL, max: 10, idleTimeoutMillis: 30000 };
  const sslEnv = (process.env.DATABASE_SSL || '').toLowerCase();
  const needsSsl = sslEnv === 'true' || sslEnv === 'require' || /supabase\.co/.test(DATABASE_URL);
  if (needsSsl) {
    cfg.ssl = { rejectUnauthorized: false };
  }
  return cfg;
}

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(buildConfig());
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  const res = await p.query(text, params);
  return res;
}

async function withTx(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { query, withTx, getPool };
