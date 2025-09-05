import { v4 as uuid } from 'uuid';
import db from './db';
import { calculateContributionPoints, checkAndAwardBadges } from './gamification';

interface DebitCard {
  id: string;
  user_id: string;
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  is_active: boolean;
  balance_cents: number;
  spending_limit_cents: number;
  cashback_rate: number;
  created_at: string;
}

interface CardTransaction {
  id: string;
  card_id: string;
  merchant: string;
  amount_cents: number;
  category: string;
  cashback_cents: number;
  points_earned: number;
  status: string;
  transaction_date: string;
  created_at: string;
}

interface TransactionResult {
  transactionId: string;
  cashbackEarned: number;
  pointsEarned: number;
  newBalance: number;
  merchant: string;
  category: string;
}

// Generate mock card number (for demo purposes)
function generateCardNumber(): string {
  const prefix = '4532'; // Visa prefix for demo
  const middle = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${middle}${suffix}`;
}

// Create debit card for user
export function createDebitCard(userId: string, cardHolderName: string): any {
  const cardId = uuid();
  const cardNumber = generateCardNumber();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 4);
  const expiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;

  db.prepare(`
    INSERT INTO debit_cards (
      id, user_id, card_number_encrypted, last_four, 
      expiry_month, expiry_year, cardholder_name, 
      is_active, balance_cents, spending_limit_cents
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cardId, 
    userId, 
    cardNumber, // In production, this should be encrypted
    cardNumber.slice(-4),
    expiryDate.getMonth() + 1,
    expiryDate.getFullYear(),
    cardHolderName,
    1, // is_active
    0, // initial balance
    500000 // $5000 spending limit
  );

  return {
    id: cardId,
    cardNumber: `****-****-****-${cardNumber.slice(-4)}`, // Masked for security
    cardHolderName,
    expiryDate: expiry,
    cashbackRate: 2.0
  };
}

// Process card transaction
export function processCardTransaction(
  cardId: string, 
  amountCents: number, 
  merchant: string, 
  category: string = 'general'
): TransactionResult {
  const card = db.prepare('SELECT * FROM debit_cards WHERE id = ? AND is_active = 1').get(cardId) as DebitCard | undefined;
  if (!card) throw new Error('Card not found or inactive');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(card.user_id) as any;
  if (user.balance_cents < amountCents) {
    throw new Error('Insufficient funds');
  }

  // Company revenue from interchange fees (typically 1.5-3% of transaction)
  const interchangeRevenueCents = Math.floor(amountCents * 0.025); // 2.5% average interchange
  
  // User gets cashback (funded by company from interchange revenue)
  const cashbackCents = Math.floor(amountCents * 0.02); // 2% cashback to user
  const pointsEarned = Math.floor(amountCents / 100); // 1 point per dollar

  // Create transaction record
  const transactionId = uuid();
  db.prepare(`
    INSERT INTO card_transactions (
      id, card_id, merchant, amount_cents, category, 
      cashback_cents, points_earned, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(transactionId, cardId, merchant, amountCents, category, cashbackCents, pointsEarned, 'completed');

  // Update user balance and points
  db.prepare(`
    UPDATE users 
    SET balance_cents = balance_cents - ? + ?, total_points = total_points + ?
    WHERE id = ?
  `).run(amountCents, cashbackCents, pointsEarned, card.user_id);

  // Award gamification points and check for badges
  const contributionPoints = calculateContributionPoints(amountCents);
  checkAndAwardBadges(card.user_id, 'card_transaction', { amount: amountCents, category });

  return {
    transactionId,
    cashbackEarned: cashbackCents,
    pointsEarned,
    newBalance: user.balance_cents - amountCents + cashbackCents,
    merchant,
    category
  };
}

// Get card transactions
export function getCardTransactions(cardId: string, limit: number = 50): CardTransaction[] {
  return db.prepare(`
    SELECT * FROM card_transactions 
    WHERE card_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(cardId, limit) as CardTransaction[];
}

// Toggle card status
export function toggleCardStatus(cardId: string, userId: string): { isActive: boolean } {
  const card = db.prepare('SELECT * FROM debit_cards WHERE id = ? AND user_id = ?').get(cardId, userId) as DebitCard | undefined;
  if (!card) throw new Error('Card not found');

  const newStatus = card.is_active ? 0 : 1;
  db.prepare('UPDATE debit_cards SET is_active = ? WHERE id = ?').run(newStatus, cardId);

  return { isActive: newStatus === 1 };
}

// Get card details
export function getCardDetails(cardId: string, userId: string): DebitCard | null {
  const card = db.prepare('SELECT * FROM debit_cards WHERE id = ? AND user_id = ?').get(cardId, userId) as DebitCard | undefined;
  return card || null;
}

// Update spending limit
export function updateSpendingLimit(cardId: string, userId: string, limitCents: number): void {
  const card = db.prepare('SELECT * FROM debit_cards WHERE id = ? AND user_id = ?').get(cardId, userId);
  if (!card) throw new Error('Card not found');

  db.prepare('UPDATE debit_cards SET spending_limit_cents = ? WHERE id = ?').run(limitCents, cardId);
}

// Get spending insights
export function getSpendingInsights(cardId: string, days: number = 30): any {
  const transactions = db.prepare(`
    SELECT category, 
           SUM(amount_cents) as total_spent,
           SUM(cashback_cents) as total_cashback,
           COUNT(*) as transaction_count
    FROM card_transactions 
    WHERE card_id = ? 
      AND created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY category
    ORDER BY total_spent DESC
  `).all(cardId, days);

  const totalSpent = transactions.reduce((sum: number, t: any) => sum + t.total_spent, 0);
  const totalCashback = transactions.reduce((sum: number, t: any) => sum + t.total_cashback, 0);

  return {
    categoryBreakdown: transactions,
    totalSpent,
    totalCashback,
    averageTransaction: totalSpent / Math.max(1, transactions.reduce((sum: number, t: any) => sum + t.transaction_count, 0)),
    period: `${days} days`
  };
}

export type { DebitCard, CardTransaction, TransactionResult };
