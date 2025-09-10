const express = require('express');

const router = express.Router();

router.post('/contribute', (_req, res) => {
  res.json({ success: true });
});
router.post('/withdraw', (_req, res) => {
  res.json({ success: true });
});
router.post('/auto-contribute', (_req, res) => {
  res.json({ success: true });
});

module.exports = router;

