-- Banking and Authentication Schema for PoolUp

-- Enhanced users table with Google OAuth support
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'guest';
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN profile_image TEXT;

-- Plaid integration table
CREATE TABLE IF NOT EXISTS plaid_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    access_token TEXT NOT NULL,
    item_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plaid_account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    account_subtype TEXT,
    is_primary BOOLEAN DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Virtual debit cards table
CREATE TABLE IF NOT EXISTS virtual_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_card_id TEXT NOT NULL UNIQUE,
    card_holder_name TEXT NOT NULL,
    last_four TEXT NOT NULL,
    exp_month INTEGER NOT NULL,
    exp_year INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- active, inactive, frozen
    total_cashback_cents INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Card transactions table
CREATE TABLE IF NOT EXISTS card_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    stripe_transaction_id TEXT,
    merchant_name TEXT NOT NULL,
    category TEXT,
    amount_cents INTEGER NOT NULL,
    cashback_cents INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    transaction_date TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TEXT NOT NULL,
    FOREIGN KEY (card_id) REFERENCES virtual_cards (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Auto contributions table
CREATE TABLE IF NOT EXISTS auto_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pool_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    frequency TEXT NOT NULL, -- weekly, biweekly, monthly
    account_id TEXT, -- Plaid account ID
    is_active BOOLEAN DEFAULT 1,
    next_contribution_date TEXT,
    last_contribution_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES pools (id) ON DELETE CASCADE
);

-- Enhanced contributions table
ALTER TABLE contributions ADD COLUMN payment_method TEXT DEFAULT 'manual';
ALTER TABLE contributions ADD COLUMN bank_account_id TEXT;
ALTER TABLE contributions ADD COLUMN transaction_id TEXT;
ALTER TABLE contributions ADD COLUMN status TEXT DEFAULT 'pending';

-- Travel perks and rewards table
CREATE TABLE IF NOT EXISTS travel_perks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    cashback_multiplier REAL DEFAULT 1.0,
    bonus_points INTEGER DEFAULT 0,
    special_offers TEXT, -- JSON array of offers
    perk_level TEXT DEFAULT 'basic', -- basic, silver, gold, platinum
    expires_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Spending insights cache table
CREATE TABLE IF NOT EXISTS spending_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_spent_cents INTEGER NOT NULL,
    category_breakdown TEXT, -- JSON object
    savings_rate REAL,
    trends TEXT, -- JSON array
    generated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Account verification table
CREATE TABLE IF NOT EXISTS account_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bank_account_id TEXT NOT NULL,
    verification_method TEXT NOT NULL, -- micro_deposits, instant
    status TEXT DEFAULT 'pending', -- pending, verified, failed
    verification_data TEXT, -- JSON with verification details
    attempts INTEGER DEFAULT 0,
    verified_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Cashback and rewards tracking
CREATE TABLE IF NOT EXISTS cashback_earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    transaction_id INTEGER,
    earning_type TEXT NOT NULL, -- transaction, bonus, referral
    amount_cents INTEGER NOT NULL,
    description TEXT,
    earned_at TEXT NOT NULL,
    redeemed_at TEXT,
    status TEXT DEFAULT 'available', -- available, redeemed, expired
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES card_transactions (id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_contributions_user_id ON auto_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_insights_user_id ON spending_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_earnings_user_id ON cashback_earnings(user_id);

-- Insert sample travel perks for new users
INSERT OR IGNORE INTO travel_perks (user_id, cashback_multiplier, bonus_points, special_offers, perk_level, created_at)
SELECT id, 1.5, 100, '["Free airport lounge access", "No foreign transaction fees", "Travel insurance included"]', 'basic', datetime('now')
FROM users WHERE auth_provider = 'google' AND id NOT IN (SELECT user_id FROM travel_perks);
