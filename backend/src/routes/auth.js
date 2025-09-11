const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loadDB, saveDB, nextId } = require('../db/fileDb');
const { publicUser, getUserByEmail } = require('../utils/users');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { auth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

router.post('/guest', (req, res) => {
  const { name } = req.body || {};
  const db = loadDB();
  const user = {
    id: nextId(db),
    name: name || 'Guest',
    email: null,
    profile_image_url: null,
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB(db);
  res.json({ id: user.id, name: user.name, email: user.email, profileImage: user.profile_image_url });
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = loadDB();
    if (getUserByEmail(db, email)) return res.status(409).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(String(password), 10);
    const user = {
      id: nextId(db),
      name: name || String(email).split('@')[0],
      email: String(email).toLowerCase(),
      password_hash: hash,
      profile_image_url: null,
      created_at: new Date().toISOString(),
      profile_image_url: null,
    };
    db.users.push(user);
    saveDB(db);
    const token = signToken(user.id);
    return res.json({ token, user: publicUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = loadDB();
    const user = getUserByEmail(db, email);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.id);
    return res.json({ token, user: publicUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Sync a Supabase-authenticated user into the local backend DB by email.
// If the user exists, returns it; otherwise creates a lightweight record.
router.post('/sync', (req, res) => {
  try {
    const { name, email, profile_image_url } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const db = loadDB();
    let user = getUserByEmail(db, email);
    if (!user) {
      user = {
        id: nextId(db),
        name: name || String(email).split('@')[0],
        email: String(email).toLowerCase(),
        profile_image_url: profile_image_url || null,
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
      saveDB(db);
    }
    return res.json({ user: publicUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Sync failed' });
  }
});

router.get('/me', auth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => String(x.id) === String(req.userId));
  if (!u) return res.status(404).json({ error: 'Not found' });
  return res.json({ user: publicUser(u) });
});

module.exports = router;
