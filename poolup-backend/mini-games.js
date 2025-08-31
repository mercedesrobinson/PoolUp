const express = require('express');
const router = express.Router();

// Mini-games API routes
router.get('/games', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user progress to determine unlocked games
    const userStats = await req.db.get(`
      SELECT 
        current_streak,
        total_contributions,
        total_saved_cents,
        total_points
      FROM user_streaks 
      WHERE user_id = ?
    `, [userId]);

    const games = [
      {
        id: 'streak_spinner',
        name: 'Streak Spinner',
        emoji: '🎰',
        description: 'Spin the wheel for bonus points!',
        unlockRequirement: { type: 'streak', value: 3 },
        isUnlocked: (userStats?.current_streak || 0) >= 3,
        rewards: { min: 10, max: 100 }
      },
      {
        id: 'savings_slots',
        name: 'Savings Slots',
        emoji: '🎲',
        description: 'Match symbols to multiply your points!',
        unlockRequirement: { type: 'contributions', value: 5 },
        isUnlocked: (userStats?.total_contributions || 0) >= 5,
        rewards: { min: 25, max: 200 }
      },
      {
        id: 'goal_crusher',
        name: 'Goal Crusher',
        emoji: '🎯',
        description: 'Hit targets to earn massive bonuses!',
        unlockRequirement: { type: 'total_saved', value: 10000 },
        isUnlocked: (userStats?.total_saved_cents || 0) >= 1000000,
        rewards: { min: 50, max: 500 }
      },
      {
        id: 'fortune_wheel',
        name: 'Fortune Wheel',
        emoji: '🎡',
        description: 'Spin for exclusive rewards and themes!',
        unlockRequirement: { type: 'points', value: 500 },
        isUnlocked: (userStats?.total_points || 0) >= 500,
        rewards: { min: 100, max: 1000, special: true }
      }
    ];

    res.json({ games, userStats });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.post('/games/:gameId/play', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { gameId } = req.params;
    const { gameResult } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate game result and calculate rewards
    const reward = calculateGameReward(gameId, gameResult);
    
    // Update user points
    await req.db.run(`
      UPDATE user_streaks 
      SET total_points = total_points + ?
      WHERE user_id = ?
    `, [reward.points, userId]);

    // Log game play
    await req.db.run(`
      INSERT INTO game_plays (user_id, game_id, points_earned, result_data, played_at)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, gameId, reward.points, JSON.stringify(gameResult), new Date().toISOString()]);

    // Check for achievement unlocks
    const achievements = await checkGameAchievements(req.db, userId, gameId, reward.points);

    res.json({ 
      reward, 
      achievements,
      message: `You earned ${reward.points} points!`
    });
  } catch (error) {
    console.error('Error processing game play:', error);
    res.status(500).json({ error: 'Failed to process game play' });
  }
});

router.get('/rewards/unlockable', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user progress
    const userStats = await req.db.get(`
      SELECT 
        us.current_streak,
        us.total_contributions,
        us.total_saved_cents,
        us.total_points,
        COUNT(ub.badge_id) as badges_earned,
        COUNT(DISTINCT p.id) as goals_completed
      FROM user_streaks us
      LEFT JOIN user_badges ub ON us.user_id = ub.user_id
      LEFT JOIN pools p ON p.creator_id = us.user_id AND p.saved_cents >= p.goal_cents
      WHERE us.user_id = ?
      GROUP BY us.user_id
    `, [userId]);

    const progress = {
      currentStreak: userStats?.current_streak || 0,
      totalContributions: userStats?.total_contributions || 0,
      totalSaved: (userStats?.total_saved_cents || 0) / 100,
      goalsCompleted: userStats?.goals_completed || 0,
      peerBoosts: 0, // TODO: Add peer boosts tracking
      totalPoints: userStats?.total_points || 0,
      badgesEarned: userStats?.badges_earned || 0
    };

    // Get unlocked rewards
    const unlockedRewards = await req.db.all(`
      SELECT * FROM unlocked_rewards 
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
    `, [userId]);

    res.json({ progress, unlockedRewards });
  } catch (error) {
    console.error('Error fetching unlockable rewards:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

router.post('/rewards/unlock', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { rewardId, rewardType } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if reward is already unlocked
    const existing = await req.db.get(`
      SELECT * FROM unlocked_rewards 
      WHERE user_id = ? AND reward_id = ?
    `, [userId, rewardId]);

    if (existing) {
      return res.status(400).json({ error: 'Reward already unlocked' });
    }

    // Unlock the reward
    await req.db.run(`
      INSERT INTO unlocked_rewards (user_id, reward_id, reward_type, unlocked_at)
      VALUES (?, ?, ?, ?)
    `, [userId, rewardId, rewardType, new Date().toISOString()]);

    res.json({ 
      success: true, 
      message: 'Reward unlocked successfully!',
      rewardId,
      rewardType
    });
  } catch (error) {
    console.error('Error unlocking reward:', error);
    res.status(500).json({ error: 'Failed to unlock reward' });
  }
});

router.get('/stats/gaming', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await req.db.get(`
      SELECT 
        COUNT(*) as games_played,
        SUM(points_earned) as total_points_from_games,
        COUNT(CASE WHEN points_earned > 50 THEN 1 END) as games_won,
        MAX(points_earned) as best_game_score
      FROM game_plays 
      WHERE user_id = ?
    `, [userId]);

    const recentGames = await req.db.all(`
      SELECT game_id, points_earned, played_at
      FROM game_plays 
      WHERE user_id = ?
      ORDER BY played_at DESC
      LIMIT 10
    `, [userId]);

    const winRate = stats.games_played > 0 ? 
      Math.round((stats.games_won / stats.games_played) * 100) : 0;

    res.json({
      gamesPlayed: stats.games_played || 0,
      gamesWon: stats.games_won || 0,
      winRate,
      totalPointsFromGames: stats.total_points_from_games || 0,
      bestScore: stats.best_game_score || 0,
      recentGames
    });
  } catch (error) {
    console.error('Error fetching gaming stats:', error);
    res.status(500).json({ error: 'Failed to fetch gaming stats' });
  }
});

function calculateGameReward(gameId, gameResult) {
  const baseRewards = {
    streak_spinner: { min: 10, max: 100 },
    savings_slots: { min: 25, max: 200 },
    goal_crusher: { min: 50, max: 500 },
    fortune_wheel: { min: 100, max: 1000 }
  };

  const gameReward = baseRewards[gameId] || { min: 10, max: 50 };
  
  // Calculate points based on game result
  let points = gameReward.min;
  
  if (gameResult.success) {
    const multiplier = gameResult.multiplier || 1;
    const bonus = gameResult.bonus || 0;
    points = Math.min(
      gameReward.max, 
      Math.floor(gameReward.min * multiplier) + bonus
    );
  }

  return {
    points,
    gameId,
    success: gameResult.success,
    special: gameResult.special || false
  };
}

async function checkGameAchievements(db, userId, gameId, pointsEarned) {
  const achievements = [];

  // Check for gaming milestones
  const gameStats = await db.get(`
    SELECT COUNT(*) as total_games, SUM(points_earned) as total_points
    FROM game_plays WHERE user_id = ?
  `, [userId]);

  // First game achievement
  if (gameStats.total_games === 1) {
    achievements.push({
      type: 'badge',
      name: 'Game Rookie',
      description: 'Played your first mini-game!',
      points: 50
    });
  }

  // High score achievement
  if (pointsEarned >= 500) {
    achievements.push({
      type: 'badge',
      name: 'High Roller',
      description: 'Scored 500+ points in a single game!',
      points: 100
    });
  }

  // Gaming addict achievement
  if (gameStats.total_games >= 50) {
    achievements.push({
      type: 'badge',
      name: 'Gaming Addict',
      description: 'Played 50 mini-games!',
      points: 200
    });
  }

  return achievements;
}

module.exports = router;
