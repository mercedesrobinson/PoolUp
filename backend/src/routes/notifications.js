const express = require('express');

const router = express.Router();

router.post('/notifications/send-test', (_req, res) => {
  res.json({ success: true, delivered: true });
});

module.exports = router;

