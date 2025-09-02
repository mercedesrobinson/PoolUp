import Database from 'better-sqlite3';

const db: Database.Database = new Database('poolup.db');

// Create tables if they don't exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  avatar_type TEXT DEFAULT 'generated',
  avatar_data TEXT,
  profile_image_url TEXT,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  balance_cents INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  allow_encouragement BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal_cents INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  destination TEXT,
  trip_date DATE,
  bonus_pot_cents INTEGER DEFAULT 0,
  group_streak INTEGER DEFAULT 0,
  pool_type TEXT DEFAULT 'group',
  is_public BOOLEAN DEFAULT FALSE,
  allow_encouragement BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT NOT NULL,
  pool_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  contribution_streak INTEGER DEFAULT 0,
  last_contribution_date DATE,
  total_contributed_cents INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, pool_id)
);

CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_method TEXT DEFAULT 'manual',
  transaction_id TEXT,
  status TEXT DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS penalties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pool_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT DEFAULT 'common',
  category TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  requirement TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  data TEXT,
  read BOOLEAN DEFAULT FALSE,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pool_id TEXT,
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method_id TEXT,
  external_transaction_id TEXT,
  description TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debit_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL,
  last_four TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  cvv_encrypted TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  balance_cents INTEGER DEFAULT 0,
  spending_limit_cents INTEGER DEFAULT 500000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_transactions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  category TEXT,
  cashback_cents INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

export default db;
