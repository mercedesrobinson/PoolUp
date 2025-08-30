import Database from 'better-sqlite3';
const db = new Database('poolup.db');

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
  payment_method TEXT DEFAULT 'manual',
  points_earned INTEGER DEFAULT 0,
  streak_bonus BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS debit_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_number TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  cashback_rate REAL DEFAULT 0.02,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS card_transactions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  merchant TEXT,
  category TEXT,
  cashback_cents INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points_required INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common'
);
CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  pool_id TEXT,
  PRIMARY KEY (user_id, badge_id)
);
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  reward_bonus_cents INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS forfeits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pool_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  paid_by_user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  pool_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pool_id, user_id)
);
CREATE TABLE IF NOT EXISTS unlockables (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unlock_percentage INTEGER NOT NULL,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at DATETIME
);
CREATE TABLE IF NOT EXISTS interest_earnings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  rate REAL NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS encouragements (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  pool_id TEXT,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);
CREATE TABLE IF NOT EXISTS public_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data TEXT NOT NULL,
  pool_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export default db;
