-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  google_id TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pools
CREATE TABLE IF NOT EXISTS pools (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  goal_cents INTEGER NOT NULL DEFAULT 0,
  saved_cents INTEGER NOT NULL DEFAULT 0,
  destination TEXT,
  trip_date TEXT,
  pool_type TEXT,
  creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  public_visibility BOOLEAN NOT NULL DEFAULT FALSE,
  bonus_pot_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Memberships
CREATE TABLE IF NOT EXISTS memberships (
  pool_id BIGINT REFERENCES pools(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (pool_id, user_id)
);

-- Contributions
CREATE TABLE IF NOT EXISTS contributions (
  id BIGSERIAL PRIMARY KEY,
  pool_id BIGINT REFERENCES pools(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  points INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  pool_id BIGINT REFERENCES pools(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  follower_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, follower_id)
);

-- Encouragements
CREATE TABLE IF NOT EXISTS encouragements (
  id BIGSERIAL PRIMARY KEY,
  to_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  from_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT UNIQUE NOT NULL,
  card_number TEXT NOT NULL,
  exp_month INTEGER NOT NULL,
  exp_year INTEGER NOT NULL,
  cvv TEXT NOT NULL,
  status TEXT NOT NULL
);

-- Card transactions
CREATE TABLE IF NOT EXISTS card_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  merchant TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invites (placeholder)
CREATE TABLE IF NOT EXISTS invites (
  id BIGSERIAL PRIMARY KEY,
  pool_id BIGINT REFERENCES pools(id) ON DELETE CASCADE,
  email TEXT,
  token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring settings
CREATE TABLE IF NOT EXISTS recurring (
  pool_id BIGINT REFERENCES pools(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (pool_id, user_id)
);

-- Penalty settings
CREATE TABLE IF NOT EXISTS penalty_settings (
  pool_id BIGINT PRIMARY KEY REFERENCES pools(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Privacy
CREATE TABLE IF NOT EXISTS privacy (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  allow_encouragement BOOLEAN NOT NULL DEFAULT TRUE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notification_tokens (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb
);
