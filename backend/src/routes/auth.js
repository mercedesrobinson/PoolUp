const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { publicUser } = require('../utils/users');
const usersRepo = require('../repos/users');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { auth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

router.post('/guest', async (req, res) => {
  const { name } = req.body || {};
  const user = await usersRepo.createUser({ name: name || 'Guest', email: null, profile_image_url: null });
  res.json({ id: String(user.id), name: user.name, email: user.email, profileImage: user.profile_image_url });
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await usersRepo.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(String(password), 10);
    const user = await usersRepo.createUser({ name: name || String(email).split('@')[0], email: String(email).toLowerCase(), password_hash: hash });
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
    const user = await usersRepo.getUserWithSecretByEmail(email);
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
router.post('/sync', async (req, res) => {
  try {
    const { name, email, profile_image_url } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const user = await usersRepo.upsertByEmail({ name: name || String(email).split('@')[0], email: String(email).toLowerCase(), profile_image_url });
    return res.json({ user: publicUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Sync failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  const u = await usersRepo.getUserById(req.userId);
  if (!u) return res.status(404).json({ error: 'Not found' });
  return res.json({ user: publicUser(u) });
});

module.exports = router;
