const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config/env');

const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      users: [],
      pools: [],
      memberships: [],
      contributions: [],
      messages: [],
      follows: [],
      encouragements: [],
      cards: [],
      cardTransactions: [],
      invites: [],
      recurring: [],
      penaltySettings: {},
      privacy: {},
      notifications: { tokens: {}, preferences: {} },
      seq: 1,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  }
}

function loadDB() {
  ensureDB();
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  // Backfill missing collections/keys for older DB files
  let mutated = false;
  const defaults = {
    users: [],
    pools: [],
    memberships: [],
    contributions: [],
    messages: [],
    follows: [],
    encouragements: [],
    cards: [],
    cardTransactions: [],
    invites: [],
    recurring: [],
    penaltySettings: {},
    privacy: {},
    notifications: { tokens: {}, preferences: {} },
    seq: 1,
  };
  for (const [key, defVal] of Object.entries(defaults)) {
    if (typeof db[key] === 'undefined') {
      db[key] = defVal;
      mutated = true;
    }
  }
  // Ensure notifications subkeys exist
  if (!db.notifications || typeof db.notifications !== 'object') {
    db.notifications = { tokens: {}, preferences: {} };
    mutated = true;
  } else {
    if (!db.notifications.tokens) { db.notifications.tokens = {}; mutated = true; }
    if (!db.notifications.preferences) { db.notifications.preferences = {}; mutated = true; }
  }
  if (mutated) saveDB(db);
  return db;
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(db) {
  const id = db.seq++;
  return String(id);
}

module.exports = {
  ensureDB,
  loadDB,
  saveDB,
  nextId,
};
