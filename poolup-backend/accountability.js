const express = require('express');
const router = express.Router();

// Forfeit system for missed contributions
router.post('/forfeit/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { userId, forfeitAmount, reason, charityId } = req.body;
    
    // Record forfeit in database
    const result = await req.db.run(`
      INSERT INTO forfeits (pool_id, user_id, amount_cents, reason, charity_id, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [poolId, userId, forfeitAmount, reason, charityId, new Date().toISOString()]);
    
    // Update user streak (break it)
    await req.db.run(`
      UPDATE user_streaks 
      SET current_streak = 0, last_contribution_date = ?
      WHERE user_id = ? AND pool_id = ?
    `, [new Date().toISOString(), userId, poolId]);
    
    // Emit forfeit event to pool members
    req.io.to(`pool_${poolId}`).emit('forfeit:created', {
      forfeitId: result.lastID,
      userId,
      amount: forfeitAmount,
      reason,
      charityId
    });
    
    res.json({ 
      forfeitId: result.lastID,
      message: 'Forfeit recorded. Your streak has been reset.',
      streakReset: true
    });
  } catch (error) {
    console.error('Forfeit creation error:', error);
    res.status(500).json({ error: 'Failed to process forfeit' });
  }
});

// Peer boost - help someone avoid forfeit
router.post('/peer-boost/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { boosterId, targetUserId, amountCents, message } = req.body;
    
    // Record peer boost
    const result = await req.db.run(`
      INSERT INTO peer_boosts (pool_id, booster_id, target_user_id, amount_cents, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [poolId, boosterId, targetUserId, amountCents, message, new Date().toISOString()]);
    
    // Add contribution on behalf of target user
    await req.db.run(`
      INSERT INTO contributions (pool_id, user_id, amount_cents, payment_method, boosted_by, created_at)
      VALUES (?, ?, ?, 'peer_boost', ?, ?)
    `, [poolId, targetUserId, amountCents, boosterId, new Date().toISOString()]);
    
    // Update pool total
    await req.db.run(`
      UPDATE pools 
      SET current_amount_cents = current_amount_cents + ?
      WHERE id = ?
    `, [amountCents, poolId]);
    
    // Award bonus points to booster
    const bonusPoints = Math.floor(amountCents / 100) * 2; // 2x points for helping
    await req.db.run(`
      UPDATE users 
      SET total_points = total_points + ?
      WHERE id = ?
    `, [bonusPoints, boosterId]);
    
    // Check for Helper badge
    const boostCount = await req.db.get(`
      SELECT COUNT(*) as count FROM peer_boosts WHERE booster_id = ?
    `, [boosterId]);
    
    if (boostCount.count >= 5) {
      await awardBadge(req.db, boosterId, 'helper');
    }
    
    // Emit boost event
    req.io.to(`pool_${poolId}`).emit('peer_boost:completed', {
      boosterId,
      targetUserId,
      amount: amountCents,
      bonusPoints,
      message
    });
    
    res.json({ 
      success: true,
      bonusPoints,
      message: 'Peer boost successful! You earned bonus points for helping.'
    });
  } catch (error) {
    console.error('Peer boost error:', error);
    res.status(500).json({ error: 'Failed to process peer boost' });
  }
});

// Get user's forfeit history
router.get('/forfeits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const forfeits = await req.db.all(`
      SELECT f.*, p.name as pool_name, c.name as charity_name
      FROM forfeits f
      JOIN pools p ON f.pool_id = p.id
      LEFT JOIN charities c ON f.charity_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json(forfeits);
  } catch (error) {
    console.error('Forfeit history error:', error);
    res.status(500).json({ error: 'Failed to fetch forfeit history' });
  }
});

// Get available charities for donations
router.get('/charities', async (req, res) => {
  try {
    const charities = await req.db.all(`
      SELECT * FROM charities WHERE active = 1 ORDER BY name
    `);
    
    res.json(charities);
  } catch (error) {
    console.error('Charities fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch charities' });
  }
});

// Process charity donation from forfeit
router.post('/donate/:forfeitId', async (req, res) => {
  try {
    const { forfeitId } = req.params;
    const { paymentMethodId } = req.body;
    
    const forfeit = await req.db.get(`
      SELECT f.*, c.name as charity_name, c.stripe_account_id
      FROM forfeits f
      JOIN charities c ON f.charity_id = c.id
      WHERE f.id = ? AND f.status = 'pending'
    `, [forfeitId]);
    
    if (!forfeit) {
      return res.status(404).json({ error: 'Forfeit not found or already processed' });
    }
    
    // Process Stripe payment to charity
    // Note: This would integrate with Stripe in production
    const donationResult = {
      id: `donation_${Date.now()}`,
      amount: forfeit.amount_cents,
      charity: forfeit.charity_name,
      status: 'completed'
    };
    
    // Update forfeit status
    await req.db.run(`
      UPDATE forfeits 
      SET status = 'completed', donation_id = ?, processed_at = ?
      WHERE id = ?
    `, [donationResult.id, new Date().toISOString(), forfeitId]);
    
    // Award Philanthropist badge
    const forfeitCount = await req.db.get(`
      SELECT COUNT(*) as count FROM forfeits 
      WHERE user_id = ? AND status = 'completed'
    `, [forfeit.user_id]);
    
    if (forfeitCount.count >= 3) {
      await awardBadge(req.db, forfeit.user_id, 'philanthropist');
    }
    
    res.json({
      success: true,
      donation: donationResult,
      message: `$${(forfeit.amount_cents / 100).toFixed(2)} donated to ${forfeit.charity_name}`
    });
  } catch (error) {
    console.error('Donation processing error:', error);
    res.status(500).json({ error: 'Failed to process donation' });
  }
});

// Get pool accountability stats
router.get('/accountability/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const stats = await req.db.get(`
      SELECT 
        COUNT(DISTINCT pm.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN us.current_streak > 0 THEN pm.user_id END) as active_streaks,
        COUNT(f.id) as total_forfeits,
        SUM(f.amount_cents) as total_forfeit_amount,
        COUNT(pb.id) as total_peer_boosts,
        SUM(pb.amount_cents) as total_boost_amount
      FROM pool_memberships pm
      LEFT JOIN user_streaks us ON pm.user_id = us.user_id AND us.pool_id = pm.pool_id
      LEFT JOIN forfeits f ON pm.pool_id = f.pool_id
      LEFT JOIN peer_boosts pb ON pm.pool_id = pb.pool_id
      WHERE pm.pool_id = ?
    `, [poolId]);
    
    const recentActivity = await req.db.all(`
      SELECT 
        'forfeit' as type,
        f.id,
        f.user_id,
        u.name as user_name,
        f.amount_cents,
        f.reason,
        f.created_at
      FROM forfeits f
      JOIN users u ON f.user_id = u.id
      WHERE f.pool_id = ?
      
      UNION ALL
      
      SELECT 
        'peer_boost' as type,
        pb.id,
        pb.target_user_id as user_id,
        u.name as user_name,
        pb.amount_cents,
        pb.message as reason,
        pb.created_at
      FROM peer_boosts pb
      JOIN users u ON pb.target_user_id = u.id
      WHERE pb.pool_id = ?
      
      ORDER BY created_at DESC
      LIMIT 10
    `, [poolId, poolId]);
    
    res.json({
      stats,
      recentActivity
    });
  } catch (error) {
    console.error('Accountability stats error:', error);
    res.status(500).json({ error: 'Failed to fetch accountability stats' });
  }
});

// Helper function to award badges
async function awardBadge(db, userId, badgeType) {
  try {
    const badge = await db.get('SELECT * FROM badges WHERE type = ?', [badgeType]);
    if (!badge) return;
    
    const existing = await db.get(
      'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badge.id]
    );
    
    if (!existing) {
      await db.run(
        'INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)',
        [userId, badge.id, new Date().toISOString()]
      );
    }
  } catch (error) {
    console.error('Badge award error:', error);
  }
}

module.exports = router;
