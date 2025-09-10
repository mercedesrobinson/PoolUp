const express = require('express');

const router = express.Router();

// Plaid stubs
router.post('/plaid/create-link-token', (_req, res) => {
  res.json({ link_token: 'mock-link-token' });
});
router.post('/plaid/exchange-token', (_req, res) => {
  res.json({ access_token: 'mock-access-token' });
});
router.get('/plaid/accounts', (_req, res) => {
  res.json({ accounts: [{ id: 'acc_1', name: 'Checking', type: 'checking', balance: 1250.55, account_id: 'acc_1' }] });
});
router.get('/plaid/balance/:accountId', (req, res) => {
  res.json({ balance: 1234.56, account_id: String(req.params.accountId) });
});
router.post('/plaid/transactions', (_req, res) => {
  res.json({ transactions: [{ id: 't1', amount: -2500, date: new Date().toISOString().slice(0, 10), description: 'Groceries', category: 'food' }] });
});

// Stripe stubs
router.post('/stripe/create-card', (_req, res) => {
  res.json({ card: { id: 'card_mock', number: '4242 4242 4242 4242', exp_month: 12, exp_year: 2030, cvc: '123', status: 'active' } });
});
router.post('/stripe/toggle-card', (req, res) => {
  res.json({ status: req.body?.freeze ? 'frozen' : 'active' });
});

module.exports = router;

