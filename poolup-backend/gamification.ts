import { v4 as uuid } from 'uuid';
import db from './db';

// Initialize default badges
export function initializeBadges() {
  const badges = [
    { name: 'First Contribution', description: 'Made your first contribution!', icon: '🎯', category: 'milestone', points_required: 0, rarity: 'common' },
    { name: 'On-time All-Star', description: 'Made 5 contributions on time', icon: '⭐', category: 'consistency', points_required: 50, rarity: 'common' },
    { name: 'Early Bird Saver', description: 'Contributed before the weekly deadline 10 times', icon: '🐦', category: 'consistency', points_required: 100, rarity: 'uncommon' },
    { name: 'Trip Captain', description: 'Created and successfully funded a pool', icon: '🧭', category: 'leadership', points_required: 200, rarity: 'rare' },
    { name: 'Streak Master', description: 'Maintained a 30-day contribution streak', icon: '🔥', category: 'streak', points_required: 300, rarity: 'rare' },
    { name: 'Team Player', description: 'Helped cover a friend\'s missed payment', icon: '🤝', category: 'social', points_required: 75, rarity: 'uncommon' },
    { name: 'Goal Crusher', description: 'Contributed 150% of your target amount', icon: '💪', category: 'achievement', points_required: 150, rarity: 'uncommon' },
    { name: 'Savings Legend', description: 'Reached level 10', icon: '👑', category: 'level', points_required: 1000, rarity: 'legendary' },
    { name: 'Card Master', description: 'Made 50 purchases with PoolUp debit card', icon: '💳', category: 'spending', points_required: 250, rarity: 'rare' },
    { name: 'Cashback King', description: 'Earned $100 in cashback rewards', icon: '💰', category: 'rewards', points_required: 500, rarity: 'epic' }
  ];

  const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO badges (id, name, description, icon, category, points_required, rarity) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  badges.forEach(badge => {
    insertBadge.run(uuid(), badge.name, badge.description, badge.icon, badge.category, badge.points_required, badge.rarity);
  });
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points_required: number;
  rarity: string;
}

interface User {
  id: string;
  total_points: number;
  longest_streak: number;
  level: number;
  balance_cents: number;
  [key: string]: any;
}

interface Membership {
  contribution_streak: number;
  last_contribution_date: string;
  [key: string]: any;
}

interface QueryResult {
  count: number;
  max_streak?: number;
  [key: string]: any;
}

// Calculate points for contribution
export function calculateContributionPoints(amountCents: number, hasStreak: boolean = false, isEarly: boolean = false): number {
  let basePoints = Math.floor(amountCents / 100); // 1 point per dollar
  let bonusPoints = 0;

  if (hasStreak) bonusPoints += Math.floor(basePoints * 0.5); // 50% streak bonus
  if (isEarly) bonusPoints += Math.floor(basePoints * 0.25); // 25% early bonus

  return basePoints + bonusPoints;
}

// Update user streak
export function updateUserStreak(userId: string, poolId: string): number {
  const membership = db.prepare(`
    SELECT contribution_streak, last_contribution_date 
    FROM memberships 
    WHERE user_id = ? AND pool_id = ?
  `).get(userId, poolId) as Membership | undefined;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastContribution = db.prepare(`
    SELECT created_at FROM contributions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(userId) as any;

  let currentStreak = membership?.contribution_streak || 0;

  if (lastContribution && lastContribution.created_at) {
    const lastDate = new Date(lastContribution.created_at);
    const daysSinceLastContribution = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastContribution === 1) {
      // Consecutive day, increment streak
      currentStreak += 1;
    } else if (daysSinceLastContribution > 1) {
      // Streak broken, reset to 1
      currentStreak = 1;
    }
    // If daysSinceLastContribution === 0, it's the same day, keep current streak
  } else {
    // First contribution ever
    currentStreak = 1;
  }

  // Update membership streak
  db.prepare(`
    UPDATE memberships 
    SET contribution_streak = ?, last_contribution_date = ?, total_contributed_cents = total_contributed_cents + ?
    WHERE user_id = ? AND pool_id = ?
  `).run(currentStreak, today, 0, userId, poolId);

  // Update user's overall streak
  const userStreaks = db.prepare(`
    SELECT MAX(contribution_streak) as max_streak 
    FROM memberships 
    WHERE user_id = ?
  `).get(userId) as QueryResult | undefined;

  const maxStreak = userStreaks?.max_streak || 0;
  
  db.prepare(`
    UPDATE users 
    SET current_streak = ?, longest_streak = MAX(longest_streak, ?)
    WHERE id = ?
  `).run(currentStreak, currentStreak, userId);

  return currentStreak;
}

// Check and award badges
export function checkAndAwardBadges(userId: string, action?: string, metadata?: any): Badge[] {
  const poolId = null; // For compatibility
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  const availableBadges = db.prepare('SELECT * FROM badges').all() as Badge[];
  const userBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId) as any[];
  const earnedBadgeIds = userBadges.map((b: any) => b.badge_id);

  const newBadges: Badge[] = [];
  
  if (!user) return newBadges;

  availableBadges.forEach((badge: Badge) => {
    if (earnedBadgeIds.includes(badge.id)) return;

    let shouldAward = false;

    switch (badge.category) {
      case 'milestone':
        if (badge.name === 'First Contribution') {
          const contributionCount = db.prepare('SELECT COUNT(*) as count FROM contributions WHERE user_id = ?').get(userId) as QueryResult | undefined;
          shouldAward = (contributionCount?.count || 0) >= 1;
        }
        break;
      
      case 'consistency':
        if (badge.name === 'On-time All-Star') {
          const onTimeCount = db.prepare('SELECT COUNT(*) as count FROM contributions WHERE user_id = ? AND streak_bonus = 1').get(userId) as QueryResult | undefined;
          shouldAward = (onTimeCount?.count || 0) >= 5;
        }
        break;
      
      case 'streak':
        shouldAward = user.longest_streak >= 30;
        break;
      
      case 'level':
        shouldAward = user.level >= 10;
        break;
      
      case 'spending':
        if (badge.name === 'Card Master') {
          const cardTransactions = db.prepare('SELECT COUNT(*) as count FROM card_transactions ct JOIN debit_cards dc ON ct.card_id = dc.id WHERE dc.user_id = ?').get(userId) as QueryResult | undefined;
          shouldAward = (cardTransactions?.count || 0) >= 50;
        }
        break;
    }

    if (shouldAward || user.total_points >= badge.points_required) {
      db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
      newBadges.push(badge);
    }
  });

  return newBadges;
}

// Create pool challenges
export function createPoolChallenges(poolId: string): void {
  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(poolId) as any;
  const challenges = [
    {
      name: 'Weekly Warriors',
      description: 'Everyone contributes this week',
      type: 'group_participation',
      target_value: 100, // 100% participation
      reward_points: 50,
      reward_bonus_cents: 1000, // $10 bonus
      duration_days: 7
    },
    {
      name: 'Early Birds',
      description: 'Make contributions before Wednesday',
      type: 'early_contribution',
      target_value: 75, // 75% early contributions
      reward_points: 25,
      reward_bonus_cents: 500,
      duration_days: 7
    },
    {
      name: 'Milestone Celebration',
      description: 'Reach 25% of goal',
      type: 'savings_milestone',
      target_value: Math.floor((pool?.goal_cents || 0) * 0.25),
      reward_points: 100,
      reward_bonus_cents: 2000,
      duration_days: 30
    }
  ];

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (id, pool_id, name, description, type, target_value, reward_points, reward_bonus_cents, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  challenges.forEach(challenge => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    insertChallenge.run(
      uuid(), poolId, challenge.name, challenge.description, challenge.type,
      challenge.target_value, challenge.reward_points, challenge.reward_bonus_cents,
      startDate, endDate
    );
  });
}

// Create unlockables for pool
export function createPoolUnlockables(poolId: string, destination: string): void {
  const unlockables = [
    { type: 'playlist', name: `${destination} Vibes Playlist`, percentage: 25 },
    { type: 'facts', name: `${destination} Fun Facts`, percentage: 50 },
    { type: 'tips', name: `${destination} Packing Tips`, percentage: 75 },
    { type: 'guide', name: `${destination} Travel Guide`, percentage: 100 }
  ];

  const insertUnlockable = db.prepare(`
    INSERT INTO unlockables (id, pool_id, type, name, description, unlock_percentage)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  unlockables.forEach(item => {
    insertUnlockable.run(
      uuid(), poolId, item.type, item.name,
      `Unlock ${item.name} when you reach ${item.percentage}% of your goal!`,
      item.percentage
    );
  });
}

// Update leaderboard
export function updateLeaderboard(poolId: string): void {
  const members = db.prepare(`
    SELECT u.id, u.name, u.total_points, m.total_contributed_cents, m.contribution_streak
    FROM users u
    JOIN memberships m ON u.id = m.user_id
    WHERE m.pool_id = ?
    ORDER BY u.total_points DESC, m.total_contributed_cents DESC
  `).all(poolId) as any[];

  const updateRank = db.prepare(`
    INSERT OR REPLACE INTO leaderboard_entries (pool_id, user_id, points, rank)
    VALUES (?, ?, ?, ?)
  `);

  members.forEach((member: any, index: number) => {
    updateRank.run(poolId, member.id, member.total_points, index + 1);
  });
}

// Calculate daily interest for float revenue - Company keeps spread, users get competitive rate
export function calculateInterest(userId: string): number {
  const user = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(userId) as User | undefined;
  if (!user || user.balance_cents <= 0) return 0;

  // User gets 2.5% APY (competitive savings rate)
  // Company invests at ~5-6% and keeps the spread as revenue
  const userDailyRate = 0.025 / 365; // 2.5% APY for users
  const userInterestCents = Math.floor(user.balance_cents * userDailyRate);
  
  // Company's revenue calculation (for internal tracking)
  const companyInvestmentRate = 0.055 / 365; // 5.5% APY company earns
  const companyRevenueCents = Math.floor(user.balance_cents * (companyInvestmentRate - userDailyRate));
  
  if (userInterestCents > 0) {
    // Add interest to user balance
    db.prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?')
      .run(userInterestCents, userId);
    
    // Log interest earning for user
    const insertInterest = db.prepare(`
      INSERT INTO interest_earnings (id, user_id, amount_cents, rate, period_start, period_end)
      VALUES (?, ?, ?, ?, date('now', '-1 day'), date('now'))
    `);
    insertInterest.run(uuid(), userId, userInterestCents, userDailyRate);
    
    // Log company revenue (for analytics/reporting)
    console.log(`Float revenue: $${(companyRevenueCents / 100).toFixed(2)} from user ${userId}`);
  }
  
  return userInterestCents;
}

// Process forfeit
export function processForfeit(userId: string, poolId: string, reason: string, amount: number = 500): string { // Default $5 forfeit
  const forfeitId = uuid();
  
  db.prepare(`
    INSERT INTO forfeits (id, user_id, pool_id, amount_cents, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(forfeitId, userId, poolId, amount, reason);

  // Add to bonus pot
  db.prepare('UPDATE pools SET bonus_pot_cents = bonus_pot_cents + ? WHERE id = ?').run(amount, poolId);

  return forfeitId;
}

import express from 'express';

const router = express.Router();

// Initialize gamification system
export function initializeGamification(): void {
  initializeBadges();
  console.log('Gamification system initialized with default badges');
}

// Export router as default
export default router;
