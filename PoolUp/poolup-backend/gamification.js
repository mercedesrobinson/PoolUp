import { v4 as uuid } from 'uuid';
import db from './db.js';

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

// Calculate points for contribution
export function calculateContributionPoints(amountCents, hasStreak = false, isEarly = false) {
  let basePoints = Math.floor(amountCents / 100); // 1 point per dollar
  let bonusPoints = 0;

  if (hasStreak) bonusPoints += Math.floor(basePoints * 0.5); // 50% streak bonus
  if (isEarly) bonusPoints += Math.floor(basePoints * 0.25); // 25% early bonus

  return basePoints + bonusPoints;
}

// Update user streak
export function updateUserStreak(userId, poolId) {
  const membership = db.prepare(`
    SELECT contribution_streak, last_contribution_date 
    FROM memberships 
    WHERE user_id = ? AND pool_id = ?
  `).get(userId, poolId);

  const today = new Date().toISOString().split('T')[0];
  const lastDate = membership?.last_contribution_date;
  
  let newStreak = 1;
  if (lastDate) {
    const daysDiff = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      newStreak = (membership.contribution_streak || 0) + 1;
    } else if (daysDiff > 1) {
      newStreak = 1; // Reset streak
    } else {
      newStreak = membership.contribution_streak || 1; // Same day
    }
  }

  // Update membership streak
  db.prepare(`
    UPDATE memberships 
    SET contribution_streak = ?, last_contribution_date = ?, total_contributed_cents = total_contributed_cents + ?
    WHERE user_id = ? AND pool_id = ?
  `).run(newStreak, today, 0, userId, poolId);

  // Update user's overall streak
  const userStreaks = db.prepare(`
    SELECT MAX(contribution_streak) as max_streak 
    FROM memberships 
    WHERE user_id = ?
  `).get(userId);

  const currentStreak = userStreaks?.max_streak || 0;
  
  db.prepare(`
    UPDATE users 
    SET current_streak = ?, longest_streak = MAX(longest_streak, ?)
    WHERE id = ?
  `).run(currentStreak, currentStreak, userId);

  return newStreak;
}

// Check and award badges
export function checkAndAwardBadges(userId, poolId = null) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const availableBadges = db.prepare('SELECT * FROM badges').all();
  const userBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId);
  const earnedBadgeIds = userBadges.map(b => b.badge_id);

  const newBadges = [];

  availableBadges.forEach(badge => {
    if (earnedBadgeIds.includes(badge.id)) return;

    let shouldAward = false;

    switch (badge.category) {
      case 'milestone':
        if (badge.name === 'First Contribution') {
          const contributionCount = db.prepare('SELECT COUNT(*) as count FROM contributions WHERE user_id = ?').get(userId);
          shouldAward = contributionCount.count >= 1;
        }
        break;
      
      case 'consistency':
        if (badge.name === 'On-time All-Star') {
          const onTimeCount = db.prepare('SELECT COUNT(*) as count FROM contributions WHERE user_id = ? AND streak_bonus = TRUE').get(userId);
          shouldAward = onTimeCount.count >= 5;
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
          const cardTransactions = db.prepare('SELECT COUNT(*) as count FROM card_transactions WHERE user_id = ?').get(userId);
          shouldAward = cardTransactions.count >= 50;
        }
        break;
    }

    if (shouldAward || user.total_points >= badge.points_required) {
      db.prepare('INSERT INTO user_badges (user_id, badge_id, pool_id) VALUES (?, ?, ?)').run(userId, badge.id, poolId);
      newBadges.push(badge);
    }
  });

  return newBadges;
}

// Create pool challenges
export function createPoolChallenges(poolId) {
  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(poolId);
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
      target_value: Math.floor(pool.goal_cents * 0.25),
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
export function createPoolUnlockables(poolId, destination) {
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
export function updateLeaderboard(poolId) {
  const members = db.prepare(`
    SELECT u.id, u.name, u.total_points, m.total_contributed_cents, m.contribution_streak
    FROM users u
    JOIN memberships m ON u.id = m.user_id
    WHERE m.pool_id = ?
    ORDER BY u.total_points DESC, m.total_contributed_cents DESC
  `).all(poolId);

  const updateRank = db.prepare(`
    INSERT OR REPLACE INTO leaderboard_entries (pool_id, user_id, points, rank)
    VALUES (?, ?, ?, ?)
  `);

  members.forEach((member, index) => {
    updateRank.run(poolId, member.id, member.total_points, index + 1);
  });
}

// Calculate daily interest for float revenue - Company keeps spread, users get competitive rate
export function calculateInterest(userId) {
  const user = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(userId);
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
export function processForfeit(userId, poolId, reason, amount = 500) { // Default $5 forfeit
  const forfeitId = uuid();
  
  db.prepare(`
    INSERT INTO forfeits (id, user_id, pool_id, amount_cents, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(forfeitId, userId, poolId, amount, reason);

  // Add to bonus pot
  db.prepare('UPDATE pools SET bonus_pot_cents = bonus_pot_cents + ? WHERE id = ?').run(amount, poolId);

  return forfeitId;
}

// Initialize gamification system
export function initializeGamification() {
  initializeBadges();
  console.log('Gamification system initialized with default badges');
}
