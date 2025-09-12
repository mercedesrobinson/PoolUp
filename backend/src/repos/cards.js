const { query } = require('../db/pg');

async function upsertCard(userId, card) {
  await query(
    `INSERT INTO cards (user_id, card_id, card_number, exp_month, exp_year, cvv, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (user_id) DO UPDATE SET card_id = EXCLUDED.card_id, card_number = EXCLUDED.card_number,
       exp_month = EXCLUDED.exp_month, exp_year = EXCLUDED.exp_year, cvv = EXCLUDED.cvv, status = EXCLUDED.status`,
    [userId, card.cardId, card.cardNumber, card.expMonth, card.expYear, card.cvv, card.status]
  );
  return card;
}

async function getCard(userId) {
  const { rows } = await query('SELECT * FROM cards WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function getCardByCardId(cardId) {
  const { rows } = await query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
  return rows[0] || null;
}

async function addTransaction(cardId, userId, tx) {
  const { rows } = await query(
    `INSERT INTO card_transactions (user_id, card_id, amount_cents, merchant, category)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [userId, cardId, tx.amountCents, tx.merchant, tx.category]
  );
  return rows[0];
}

async function listTransactions(userId) {
  const { rows } = await query('SELECT * FROM card_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
  return rows;
}

async function toggleCard(cardId) {
  const { rows } = await query('SELECT status FROM cards WHERE card_id = $1', [cardId]);
  if (!rows.length) return null;
  const next = rows[0].status === 'active' ? 'frozen' : 'active';
  await query('UPDATE cards SET status = $2 WHERE card_id = $1', [cardId, next]);
  return next;
}

module.exports = { upsertCard, getCard, getCardByCardId, addTransaction, listTransactions, toggleCard };
