const express = require('express');
const { getIO } = require('../sockets/io');
const messagesRepo = require('../repos/messages');

const router = express.Router();

router.get('/:poolId', async (req, res) => {
  const items = await messagesRepo.listByPool(req.params.poolId);
  res.json({ data: items });
});

router.get('/by-pool/:poolId', async (req, res) => {
  const items = await messagesRepo.listByPool(req.params.poolId);
  res.json(items);
});

router.post('/', async (req, res) => {
  const { pool_id, user_id, content } = req.body || {};
  const { id } = await messagesRepo.createMessage({ pool_id, user_id, content });
  const io = getIO();
  if (io) io.emit('message', { id, poolId: String(pool_id), user_id: String(user_id), body: String(content || ''), created_at: new Date().toISOString() });
  res.json({ data: { id } });
});

module.exports = router;
