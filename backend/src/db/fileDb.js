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
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
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

