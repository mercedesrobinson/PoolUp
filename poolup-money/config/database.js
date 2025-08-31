const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const logger = require('../utils/logger');

let db = null;

async function initializeDatabase() {
  try {
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../poolup_money.db');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Create tables
    await createTables();
    
    logger.info('Database initialized successfully');
    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth DATE,
      ssn_last_4 TEXT,
      address_line_1 TEXT,
      address_line_2 TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'US',
      kyc_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Plaid items (bank connections)
    `CREATE TABLE IF NOT EXISTS plaid_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_id TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      institution_id TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`,

    // Bank accounts
    `CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      plaid_item_id INTEGER NOT NULL,
      account_id TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      account_subtype TEXT,
      mask TEXT,
      current_balance DECIMAL(15,2) DEFAULT 0.00,
      available_balance DECIMAL(15,2) DEFAULT 0.00,
      is_primary BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (plaid_item_id) REFERENCES plaid_items(id)
    )`,

    // PoolUp internal accounts (for float revenue)
    `CREATE TABLE IF NOT EXISTS poolup_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      account_number TEXT UNIQUE NOT NULL,
      balance DECIMAL(15,2) DEFAULT 0.00,
      interest_earned DECIMAL(15,2) DEFAULT 0.00,
      last_interest_calculation DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`,

    // Savings pools
    `CREATE TABLE IF NOT EXISTS savings_pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT UNIQUE NOT NULL,
      creator_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      goal_amount DECIMAL(15,2) NOT NULL,
      current_amount DECIMAL(15,2) DEFAULT 0.00,
      contribution_frequency TEXT DEFAULT 'weekly',
      contribution_amount DECIMAL(15,2) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      pool_type TEXT DEFAULT 'group',
      max_members INTEGER DEFAULT 10,
      auto_contribute BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(user_id)
    )`,

    // Pool memberships
    `CREATE TABLE IF NOT EXISTS pool_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      contribution_amount DECIMAL(15,2) NOT NULL,
      total_contributed DECIMAL(15,2) DEFAULT 0.00,
      join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      auto_contribute BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (pool_id) REFERENCES savings_pools(pool_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      UNIQUE(pool_id, user_id)
    )`,

    // ACH transfers
    `CREATE TABLE IF NOT EXISTS ach_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      from_account_id TEXT,
      to_account_id TEXT,
      amount DECIMAL(15,2) NOT NULL,
      fee DECIMAL(15,2) DEFAULT 0.00,
      transfer_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      failure_reason TEXT,
      pool_id TEXT,
      scheduled_date DATE,
      processed_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (pool_id) REFERENCES savings_pools(pool_id)
    )`,

    // Float revenue tracking
    `CREATE TABLE IF NOT EXISTS float_revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calculation_date DATE NOT NULL,
      total_user_balance DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(8,6) NOT NULL,
      daily_revenue DECIMAL(15,2) NOT NULL,
      cumulative_revenue DECIMAL(15,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // User interest earnings
    `CREATE TABLE IF NOT EXISTS user_interest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      calculation_date DATE NOT NULL,
      balance DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(8,6) NOT NULL,
      daily_interest DECIMAL(15,2) NOT NULL,
      cumulative_interest DECIMAL(15,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`,

    // Transaction history
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      account_id TEXT,
      pool_id TEXT,
      amount DECIMAL(15,2) NOT NULL,
      transaction_type TEXT NOT NULL,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'completed',
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (pool_id) REFERENCES savings_pools(pool_id)
    )`
  ];

  for (const table of tables) {
    await db.exec(table);
  }

  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_poolup_accounts_user_id ON poolup_accounts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_savings_pools_creator_id ON savings_pools(creator_id)',
    'CREATE INDEX IF NOT EXISTS idx_pool_memberships_user_id ON pool_memberships(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool_id ON pool_memberships(pool_id)',
    'CREATE INDEX IF NOT EXISTS idx_ach_transfers_user_id ON ach_transfers(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_pool_id ON transactions(pool_id)'
  ];

  for (const index of indexes) {
    await db.exec(index);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

module.exports = {
  initializeDatabase,
  getDatabase
};
