const fs = require('fs');
const path = require('path');
const { query } = require('./pg');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await query(sql);
  // Attempt to widen integer IDs to BIGINT if older schema exists
  try {
    const patch = fs.readFileSync(path.join(__dirname, 'patch-bigint.sql'), 'utf-8');
    await query(patch);
  } catch (_) {}
}

module.exports = { initDb };
