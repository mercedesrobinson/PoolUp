const express = require('express');
const { loadDB, saveDB, nextId } = require('../db/fileDb');

const router = express.Router();

router.post('/users/:userId/debit-card', (req, res) => {
  const db = loadDB();
  const userId = String(req.params.userId);
  const card = {
    userId,
    cardId: 'card_' + nextId(db),
    cardNumber: '4242 4242 4242 4242',
    expMonth: 12,
    expYear: 2030,
    cvv: '123',
    status: 'active',
  };
  db.cards = db.cards.filter((c) => c.userId !== userId).concat(card);
  saveDB(db);
  res.json(card);
});

router.get('/users/:userId/debit-card', (req, res) => {
  const db = loadDB();
  const card = db.cards.find((c) => c.userId === String(req.params.userId));
  res.json(card || null);
});

router.post('/debit-card/:cardId/transaction', (req, res) => {
  const db = loadDB();
  const { amountCents, merchant, category } = req.body || {};
  const id = nextId(db);
  const card = db.cards.find((c) => c.cardId === String(req.params.cardId));
  if (!card) return res.status(404).json({ error: 'Card not found' });
  const tx = {
    id,
    userId: card.userId,
    cardId: card.cardId,
    amountCents: Number(amountCents) || 0,
    merchant: merchant || 'Merchant',
    category: category || 'general',
    created_at: new Date().toISOString(),
  };
  db.cardTransactions.push(tx);
  saveDB(db);
  res.json({ success: true, id });
});

router.get('/users/:userId/card-transactions', (req, res) => {
  const db = loadDB();
  const items = db.cardTransactions.filter((t) => String(t.userId) === String(req.params.userId)).slice(-50);
  res.json(items);
});

router.patch('/debit-card/:cardId/toggle', (req, res) => {
  const db = loadDB();
  const card = db.cards.find((c) => c.cardId === String(req.params.cardId));
  if (!card) return res.status(404).json({ error: 'Card not found' });
  card.status = card.status === 'active' ? 'frozen' : 'active';
  saveDB(db);
  res.json({ status: card.status });
});

module.exports = router;

