const express = require('express');
const router = express.Router();

// Get user badges
router.get('/badges/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = await global.db.all(`
      SELECT * FROM badges WHERE user_id = ? ORDER BY earned_at DESC
    `, [userId]);
    res.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Failed to get badges' });
  }
});

// Get user streak
router.get('/streak/:userId/:poolId?', async (req, res) => {
  try {
    const { userId, poolId } = req.params;
    const streak = await global.db.get(`
      SELECT * FROM user_streaks 
      WHERE user_id = ? ${poolId ? 'AND pool_id = ?' : 'AND pool_id IS NULL'}
    `, poolId ? [userId, poolId] : [userId]);
    
    res.json(streak || { streak_count: 0, longest_streak: 0 });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Failed to get streak' });
  }
});

// Award badge
router.post('/badge/award', async (req, res) => {
  try {
    const { userId, badgeType, badgeName, poolId } = req.body;
    
    const existing = await global.db.get(`
      SELECT * FROM badges WHERE user_id = ? AND badge_type = ? AND badge_name = ?
    `, [userId, badgeType, badgeName]);
    
    if (existing) {
      return res.json({ message: 'Badge already earned' });
    }
    
    await global.db.run(`
      INSERT INTO badges (user_id, badge_type, badge_name, earned_at, pool_id)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, badgeType, badgeName, new Date().toISOString(), poolId]);
    
    res.json({ message: 'Badge awarded successfully' });
  } catch (error) {
    console.error('Award badge error:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// Update streak
router.post('/streak/update', async (req, res) => {
  try {
    const { userId, poolId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    let streak = await global.db.get(`
      SELECT * FROM user_streaks WHERE user_id = ? AND pool_id = ?
    `, [userId, poolId]);
    
    if (!streak) {
      await global.db.run(`
        INSERT INTO user_streaks (user_id, pool_id, streak_count, last_contribution_date, longest_streak, created_at)
        VALUES (?, ?, 1, ?, 1, ?)
      `, [userId, poolId, today, new Date().toISOString()]);
      streak = { streak_count: 1, longest_streak: 1 };
    } else {
      const lastDate = new Date(streak.last_contribution_date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      let newStreak = 1;
      if (daysDiff === 1) {
        newStreak = streak.streak_count + 1;
      } else if (daysDiff === 0) {
        newStreak = streak.streak_count;
      }
      
      const newLongest = Math.max(streak.longest_streak, newStreak);
      
      await global.db.run(`
        UPDATE user_streaks 
        SET streak_count = ?, last_contribution_date = ?, longest_streak = ?
        WHERE user_id = ? AND pool_id = ?
      `, [newStreak, today, newLongest, userId, poolId]);
      
      streak = { streak_count: newStreak, longest_streak: newLongest };
    }
    
    if (streak.streak_count === 7) {
      await awardBadge(userId, 'streak', 'Week Warrior', poolId);
    } else if (streak.streak_count === 30) {
      await awardBadge(userId, 'streak', 'Streak Master', poolId);
    }
    
    res.json(streak);
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

async function awardBadge(userId, badgeType, badgeName, poolId = null) {
  try {
    const existing = await global.db.get(`
      SELECT * FROM badges WHERE user_id = ? AND badge_type = ? AND badge_name = ?
    `, [userId, badgeType, badgeName]);
    
    if (!existing) {
      await global.db.run(`
        INSERT INTO badges (user_id, badge_type, badge_name, earned_at, pool_id)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, badgeType, badgeName, new Date().toISOString(), poolId]);
    }
  } catch (error) {
    console.error('Award badge error:', error);
  }
}

router.get('/milestones/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const milestones = await global.db.all(`
      SELECT * FROM pool_milestones WHERE pool_id = ? ORDER BY milestone_percentage
    `, [poolId]);
    res.json(milestones);
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Failed to get milestones' });
  }
});

router.post('/milestones/check', async (req, res) => {
  try {
    const { poolId } = req.body;
    const pool = await global.db.get('SELECT * FROM pools WHERE id = ?', [poolId]);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    const progress = pool.current_amount_cents / pool.goal_amount_cents;
    const milestonePercentages = [25, 50, 75, 100];
    const newMilestones = [];
    
    for (const percentage of milestonePercentages) {
      if (progress >= percentage / 100) {
        const existing = await global.db.get(`
          SELECT * FROM pool_milestones WHERE pool_id = ? AND milestone_percentage = ?
        `, [poolId, percentage]);
        
        if (!existing) {
          await global.db.run(`
            INSERT INTO pool_milestones (pool_id, milestone_percentage, reached_at, celebration_unlocked)
            VALUES (?, ?, ?, 1)
          `, [poolId, percentage, new Date().toISOString()]);
          newMilestones.push({ percentage, reached: true });
        }
      }
    }
    
    res.json({ newMilestones, currentProgress: Math.round(progress * 100) });
  } catch (error) {
    console.error('Check milestones error:', error);
    res.status(500).json({ error: 'Failed to check milestones' });
  }
});

module.exports = router;
