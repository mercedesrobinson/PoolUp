const express = require('express');
const { loadDB, saveDB, nextId } = require('../db/fileDb');
const { getIO } = require('../sockets/io');

const router = express.Router();

router.get('/:poolId', (req, res) => {
  const db = loadDB();
  const items = db.messages
    .filter((m) => String(m.poolId) === String(req.params.poolId))
    .map((m) => ({ id: m.id, pool_id: m.poolId, user_id: m.userId, body: m.body, created_at: m.createdAt }));
  res.json({ data: items });
});

router.get('/by-pool/:poolId', (req, res) => {
  const db = loadDB();
  const items = db.messages
    .filter((m) => String(m.poolId) === String(req.params.poolId))
    .map((m) => ({ id: m.id, pool_id: m.poolId, user_id: m.userId, body: m.body, created_at: m.createdAt }));
  res.json(items);
});

router.post('/', (req, res) => {
  const { pool_id, user_id, content } = req.body || {};
  const db = loadDB();
  const id = nextId(db);
  const msg = { id, poolId: String(pool_id), userId: String(user_id), body: String(content || ''), createdAt: new Date().toISOString() };
  db.messages.push(msg);
  saveDB(db);
  const io = getIO();
  if (io) io.emit('message', { id: msg.id, poolId: msg.poolId, user_id: msg.userId, body: msg.body, created_at: msg.createdAt });
  res.json({ data: { id: msg.id } });
});

module.exports = router;

