import Database from 'better-sqlite3';
const db = new Database('poolup.db');

// Create tables if they don't exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT
);
CREATE TABLE IF NOT EXISTS pools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal_cents INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT NOT NULL,
  pool_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (user_id, pool_id)
);
CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export default db;
