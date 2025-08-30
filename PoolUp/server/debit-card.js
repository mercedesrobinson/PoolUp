import { v4 as uuid } from 'uuid';
import db from './db.js';
import { calculateContributionPoints, checkAndAwardBadges } from './gamification.js';

// Generate mock card number (for demo purposes)
function generateCardNumber() {
  const prefix = '4532'; // Visa prefix for demo
  const middle = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${middle}${suffix}`;
}

// Create debit card for user
export function createDebitCard(userId, cardHolderName) {
  const cardId = uuid();
  const cardNumber = generateCardNumber();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 4);
  const expiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;

  db.prepare(`
    INSERT INTO debit_cards (id, user_id, card_number, card_holder_name, expiry_date, cashback_rate)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cardId, userId, cardNumber, cardHolderName, expiry, 0.02); // 2% cashback

  return {
    id: cardId,
    cardNumber: `****-****-****-${cardNumber.slice(-4)}`, // Masked for security
    cardHolderName,
    expiryDate: expiry,
    cashbackRate: 2.0
  };
}

// Process card transaction
export function processCardTransaction(cardId, amountCents, merchant, category = 'general') {
  const card = db.prepare('SELECT * FROM debit_cards WHERE id = ? AND is_active = TRUE').get(cardId);
  if (!card) throw new Error('Card not found or inactive');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(card.user_id);
  if (user.balance_cents < amountCents) {
    throw new Error('Insufficient funds');
  }

  // Company revenue from interchange fees (typically 1.5-3% of transaction)
  const interchangeRevenueCents = Math.floor(amountCents * 0.025); // 2.5% average interchange
  
  // User gets cashback (funded by company from interchange revenue)
  const cashbackCents = Math.floor(amountCents * 0.02); // 2% cashback to user
  const pointsEarned = Math.floor(amountCents / 100); // 1 point per dollar
  
  // Company keeps the spread (0.5% in this example)
  const companyProfitCents = interchangeRevenueCents - cashbackCents;

  // Create transaction record
  const transactionId = uuid();
  db.prepare(`
    INSERT INTO card_transactions (id, card_id, user_id, amount_cents, merchant, category, cashback_cents, points_earned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(transactionId, cardId, card.user_id, amountCents, merchant, category, cashbackCents, pointsEarned);

  // Update user balance and points
  db.prepare(`
    UPDATE users SET balance_cents = balance_cents - ?, total_points = total_points + ?
    WHERE id = ?
  `).run(amountCents - cashbackCents, pointsEarned, card.user_id);

  // Update card spending
  db.prepare(`
    UPDATE debit_cards SET total_spent_cents = total_spent_cents + ?
    WHERE id = ?
  `).run(amountCents, cardId);

  // Log company revenue for analytics
  console.log(`Debit card revenue: $${(companyProfitCents / 100).toFixed(2)} from transaction ${transactionId}`);

  // Check for new badges
  const newBadges = checkAndAwardBadges(card.user_id);

  return {
    transactionId,
    amountCents,
    cashbackCents,
    pointsEarned,
    merchant,
    category,
    newBadges
  };
}

// Get card transactions
export function getCardTransactions(userId, limit = 50) {
  return db.prepare(`
    SELECT ct.*, dc.card_number
    FROM card_transactions ct
    JOIN debit_cards dc ON ct.card_id = dc.id
    WHERE ct.user_id = ?
    ORDER BY ct.created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

// Get card details
export function getCardDetails(userId) {
  const card = db.prepare(`
    SELECT id, card_number, card_holder_name, expiry_date, cashback_rate, is_active, created_at
    FROM debit_cards 
    WHERE user_id = ? AND is_active = TRUE
  `).get(userId);

  if (!card) return null;

  // Get transaction stats
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as transaction_count,
      SUM(amount_cents) as total_spent_cents,
      SUM(cashback_cents) as total_cashback_cents,
      SUM(points_earned) as total_points_earned
    FROM card_transactions 
    WHERE user_id = ?
  `).get(userId);

  return {
    ...card,
    cardNumber: `****-****-****-${card.card_number.slice(-4)}`,
    stats: stats || {
      transaction_count: 0,
      total_spent_cents: 0,
      total_cashback_cents: 0,
      total_points_earned: 0
    }
  };
}

// Travel spending perks
export function getTravelPerks(userId) {
  const user = db.prepare('SELECT level, total_points FROM users WHERE id = ?').get(userId);
  const cardTransactions = db.prepare(`
    SELECT COUNT(*) as travel_transactions, SUM(cashback_cents) as travel_cashback
    FROM card_transactions 
    WHERE user_id = ? AND category IN ('travel', 'hotel', 'airline', 'restaurant')
  `).get(userId);

  let perks = {
    cashbackMultiplier: 1.0,
    bonusPoints: 0,
    specialOffers: []
  };

  // Level-based perks
  if (user.level >= 5) {
    perks.cashbackMultiplier = 1.5; // 50% bonus cashback
    perks.specialOffers.push('Airport lounge access');
  }
  
  if (user.level >= 10) {
    perks.cashbackMultiplier = 2.0; // Double cashback
    perks.specialOffers.push('Free checked bag');
    perks.specialOffers.push('Hotel upgrade priority');
  }

  // Travel spending bonuses
  if (cardTransactions.travel_transactions >= 10) {
    perks.bonusPoints = 500;
    perks.specialOffers.push('5% off next booking');
  }

  return perks;
}

// Freeze/unfreeze card
export function toggleCardStatus(cardId, userId) {
  const card = db.prepare('SELECT * FROM debit_cards WHERE id = ? AND user_id = ?').get(cardId, userId);
  if (!card) throw new Error('Card not found');

  const newStatus = !card.is_active;
  db.prepare('UPDATE debit_cards SET is_active = ? WHERE id = ?').run(newStatus, cardId);

  return { cardId, isActive: newStatus };
}

// Get spending insights
export function getSpendingInsights(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const categorySpending = db.prepare(`
    SELECT 
      category,
      COUNT(*) as transaction_count,
      SUM(amount_cents) as total_spent,
      SUM(cashback_cents) as total_cashback
    FROM card_transactions 
    WHERE user_id = ? AND created_at >= ?
    GROUP BY category
    ORDER BY total_spent DESC
  `).all(userId, startDate.toISOString());

  const dailySpending = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(amount_cents) as daily_spent,
      SUM(cashback_cents) as daily_cashback
    FROM card_transactions 
    WHERE user_id = ? AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(userId, startDate.toISOString());

  return {
    categoryBreakdown: categorySpending,
    dailyTrends: dailySpending,
    period: `${days} days`
  };
}
