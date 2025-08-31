-- Add payday_settings table for personalized streak tracking
CREATE TABLE IF NOT EXISTS payday_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'weekly', -- 'weekly', 'biweekly', 'monthly'
  weekly_day TEXT DEFAULT 'friday', -- day of week for weekly payments
  biweekly_start TEXT, -- start date for biweekly calculations (YYYY-MM-DD)
  monthly_dates TEXT DEFAULT '["1", "15"]', -- JSON array of monthly payment dates
  enable_streaks INTEGER DEFAULT 1, -- 1 for enabled, 0 for disabled
  reminder_days INTEGER DEFAULT 1, -- days before payday to send reminder
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add streak tracking to contributions
ALTER TABLE contributions ADD COLUMN payday_streak INTEGER DEFAULT 0;
ALTER TABLE contributions ADD COLUMN payday_window_start TEXT;
ALTER TABLE contributions ADD COLUMN payday_window_end TEXT;

-- Add streak stats to users table
ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN best_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN next_payday TEXT;

-- Create index for efficient payday queries
CREATE INDEX IF NOT EXISTS idx_payday_settings_user_id ON payday_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_payday_streak ON contributions(user_id, payday_streak);

-- Insert default payday settings for existing users
INSERT OR IGNORE INTO payday_settings (user_id, type, weekly_day, enable_streaks)
SELECT id, 'weekly', 'friday', 1 FROM users;
