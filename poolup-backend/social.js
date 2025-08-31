const express = require('express');
const router = express.Router();

// Get leaderboard data
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    
    let query;
    switch (type) {
      case 'generous':
        query = `
          SELECT u.id, u.name, u.profile_image, 
                 SUM(c.amount_cents) as total_contributed,
                 COUNT(c.id) as contribution_count
          FROM users u
          JOIN contributions c ON u.id = c.user_id
          GROUP BY u.id
          ORDER BY total_contributed DESC
          LIMIT ?
        `;
        break;
      case 'consistent':
        query = `
          SELECT u.id, u.name, u.profile_image,
                 us.current_streak, us.longest_streak,
                 COUNT(c.id) as contribution_count
          FROM users u
          LEFT JOIN user_streaks us ON u.id = us.user_id
          LEFT JOIN contributions c ON u.id = c.user_id
          WHERE us.current_streak > 0
          GROUP BY u.id
          ORDER BY us.current_streak DESC, us.longest_streak DESC
          LIMIT ?
        `;
        break;
      case 'achievers':
        query = `
          SELECT u.id, u.name, u.profile_image,
                 COUNT(DISTINCT ub.badge_id) as badge_count,
                 GROUP_CONCAT(DISTINCT b.name) as badge_names
          FROM users u
          LEFT JOIN user_badges ub ON u.id = ub.user_id
          LEFT JOIN badges b ON ub.badge_id = b.id
          GROUP BY u.id
          ORDER BY badge_count DESC
          LIMIT ?
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }
    
    const results = await req.db.all(query, [limit]);
    res.json(results);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get pool chat messages
router.get('/chat/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await req.db.all(`
      SELECT m.*, u.name as user_name, u.profile_image
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.pool_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [poolId, limit, offset]);
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Chat fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send chat message
router.post('/chat/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { userId, message, messageType = 'text' } = req.body;
    
    if (!message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    const result = await req.db.run(`
      INSERT INTO messages (pool_id, user_id, message, message_type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [poolId, userId, message.trim(), messageType, new Date().toISOString()]);
    
    const newMessage = await req.db.get(`
      SELECT m.*, u.name as user_name, u.profile_image
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `, [result.lastID]);
    
    // Emit to all pool members via Socket.IO
    req.io.to(`pool_${poolId}`).emit('chat:message', newMessage);
    
    res.json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Create shareable milestone card
router.post('/milestone-card', async (req, res) => {
  try {
    const { poolId, userId, milestoneType, customMessage } = req.body;
    
    const pool = await req.db.get('SELECT * FROM pools WHERE id = ?', [poolId]);
    const user = await req.db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!pool || !user) {
      return res.status(404).json({ error: 'Pool or user not found' });
    }
    
    const progress = pool.current_amount_cents / pool.goal_amount_cents;
    
    let cardData = {
      id: Date.now().toString(),
      poolName: pool.name,
      userName: user.name,
      userAvatar: user.profile_image,
      progress: Math.round(progress * 100),
      currentAmount: pool.current_amount_cents / 100,
      goalAmount: pool.goal_amount_cents / 100,
      theme: pool.visual_theme || 'beach_vacation',
      milestoneType,
      customMessage,
      createdAt: new Date().toISOString()
    };
    
    // Add milestone-specific data
    switch (milestoneType) {
      case 'halfway':
        cardData.title = '🎯 Halfway There!';
        cardData.subtitle = `${user.name} reached 50% of their goal`;
        break;
      case 'goal_reached':
        cardData.title = '🎉 Goal Achieved!';
        cardData.subtitle = `${user.name} completed their ${pool.name} goal`;
        break;
      case 'streak':
        const streak = await req.db.get('SELECT current_streak FROM user_streaks WHERE user_id = ?', [userId]);
        cardData.title = `🔥 ${streak?.current_streak || 0} Day Streak!`;
        cardData.subtitle = `${user.name} is on fire with consistency`;
        break;
      case 'badge':
        cardData.title = '🏆 New Badge Earned!';
        cardData.subtitle = `${user.name} unlocked a new achievement`;
        break;
    }
    
    res.json(cardData);
  } catch (error) {
    console.error('Milestone card error:', error);
    res.status(500).json({ error: 'Failed to create milestone card' });
  }
});

// Get pool activity feed
router.get('/activity/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { limit = 20 } = req.query;
    
    const activities = await req.db.all(`
      SELECT 
        'contribution' as type,
        c.id,
        c.user_id,
        u.name as user_name,
        u.profile_image,
        c.amount_cents,
        c.created_at,
        NULL as badge_name,
        NULL as streak_count
      FROM contributions c
      JOIN users u ON c.user_id = u.id
      WHERE c.pool_id = ?
      
      UNION ALL
      
      SELECT 
        'badge' as type,
        ub.id,
        ub.user_id,
        u.name as user_name,
        u.profile_image,
        NULL as amount_cents,
        ub.earned_at as created_at,
        b.name as badge_name,
        NULL as streak_count
      FROM user_badges ub
      JOIN users u ON ub.user_id = u.id
      JOIN badges b ON ub.badge_id = b.id
      JOIN pool_memberships pm ON u.id = pm.user_id
      WHERE pm.pool_id = ?
      
      ORDER BY created_at DESC
      LIMIT ?
    `, [poolId, poolId, limit]);
    
    res.json(activities);
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Pool challenges and competitions
router.post('/challenge/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { challengeType, duration, target, createdBy } = req.body;
    
    const challenge = {
      id: Date.now().toString(),
      poolId,
      challengeType, // 'most_contributions', 'consistency', 'team_goal'
      duration, // days
      target,
      createdBy,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };
    
    // Emit challenge to all pool members
    req.io.to(`pool_${poolId}`).emit('challenge:new', challenge);
    
    res.json(challenge);
  } catch (error) {
    console.error('Challenge creation error:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

module.exports = router;
