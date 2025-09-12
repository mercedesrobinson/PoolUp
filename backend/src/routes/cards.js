const express = require('express');
const cardsRepo = require('../repos/cards');

const router = express.Router();

router.post('/users/:userId/debit-card', async (req, res) => {
  const userId = String(req.params.userId);
  const card = {
    userId,
    cardId: 'card_' + Math.random().toString(36).slice(2, 10),
    cardNumber: '4242 4242 4242 4242',
    expMonth: 12,
    expYear: 2030,
    cvv: '123',
    status: 'active',
  };
  await cardsRepo.upsertCard(userId, card);
  res.json(card);
});

router.get('/users/:userId/debit-card', async (req, res) => {
  const card = await cardsRepo.getCard(String(req.params.userId));
  res.json(card || null);
});

router.post('/debit-card/:cardId/transaction', async (req, res) => {
  const { amountCents, merchant, category } = req.body || {};
  const cardId = String(req.params.cardId);
  const card = await cardsRepo.getCardByCardId(cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  const ins = await cardsRepo.addTransaction(cardId, card.user_id, { amountCents: Number(amountCents) || 0, merchant: merchant || 'Merchant', category: category || 'general' });
  res.json({ success: true, id: String(ins.id) });
});

router.get('/users/:userId/card-transactions', async (req, res) => {
  const items = await cardsRepo.listTransactions(String(req.params.userId));
  res.json(items);
});

router.patch('/debit-card/:cardId/toggle', async (req, res) => {
  const next = await cardsRepo.toggleCard(String(req.params.cardId));
  if (!next) return res.status(404).json({ error: 'Card not found' });
  res.json({ status: next });
});

module.exports = router;
