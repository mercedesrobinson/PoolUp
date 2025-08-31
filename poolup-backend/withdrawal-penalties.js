const express = require('express');
const router = express.Router();

// Create withdrawal request with penalty calculation
router.post('/pools/:poolId/withdraw', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { userId, amountCents, reason } = req.body;
    
    if (!userId || !amountCents || amountCents <= 0) {
      return res.status(400).json({ error: 'Valid userId and amountCents required' });
    }

    // Get pool details including penalty settings
    const pool = await db.get(`
      SELECT * FROM pools 
      WHERE id = ? AND penalty_enabled = 1
    `, [poolId]);

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found or penalties not enabled' });
    }

    // Check if user is member of the pool
    const membership = await db.get(`
      SELECT * FROM pool_memberships 
      WHERE pool_id = ? AND user_id = ?
    `, [poolId, userId]);

    if (!membership) {
      return res.status(403).json({ error: 'User not a member of this pool' });
    }

    // Calculate penalty if withdrawing before target date
    let penaltyAmount = 0;
    let isPenaltyApplicable = false;

    if (pool.trip_date) {
      const targetDate = new Date(pool.trip_date);
      const currentDate = new Date();
      
      if (currentDate < targetDate) {
        isPenaltyApplicable = true;
        penaltyAmount = Math.round(amountCents * (pool.penalty_percentage / 100));
      }
    }

    // For group pools, check if all members agreed to penalties
    if (pool.pool_type === 'group' && pool.penalty_requires_consensus) {
      const allMembers = await db.all(`
        SELECT COUNT(*) as total_members FROM pool_memberships 
        WHERE pool_id = ?
      `, [poolId]);

      const agreedMembers = await db.all(`
        SELECT COUNT(*) as agreed_members FROM pool_memberships 
        WHERE pool_id = ? AND penalty_agreed = 1
      `, [poolId]);

      if (agreedMembers[0].agreed_members !== allMembers[0].total_members) {
        return res.status(400).json({ 
          error: 'All group members must agree to penalty system before withdrawals can be penalized' 
        });
      }
    }

    // Create withdrawal record
    const result = await db.run(`
      INSERT INTO withdrawals (
        pool_id, user_id, amount_cents, penalty_amount_cents, 
        reason, status, is_early_withdrawal, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      poolId, userId, amountCents, penaltyAmount, 
      reason || 'User withdrawal', isPenaltyApplicable, 
      new Date().toISOString()
    ]);

    res.json({
      withdrawalId: result.lastID,
      amountRequested: amountCents,
      penaltyAmount,
      netAmount: amountCents - penaltyAmount,
      isPenaltyApplicable,
      penaltyPercentage: pool.penalty_percentage,
      message: isPenaltyApplicable 
        ? `Early withdrawal penalty of ${pool.penalty_percentage}% (${penaltyAmount/100} dollars) will be applied`
        : 'No penalty applied - withdrawal after target date'
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
});

// Get withdrawal history for a user
router.get('/users/:userId/withdrawals', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const withdrawals = await db.all(`
      SELECT w.*, p.name as pool_name, p.penalty_percentage
      FROM withdrawals w
      JOIN pools p ON w.pool_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json(withdrawals.map(w => ({
      id: w.id,
      poolName: w.pool_name,
      amountCents: w.amount_cents,
      penaltyAmountCents: w.penalty_amount_cents,
      netAmountCents: w.amount_cents - w.penalty_amount_cents,
      isEarlyWithdrawal: w.is_early_withdrawal,
      penaltyPercentage: w.penalty_percentage,
      status: w.status,
      reason: w.reason,
      createdAt: w.created_at
    })));

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawal history' });
  }
});

// Update pool member penalty agreement (for group pools)
router.post('/pools/:poolId/members/:userId/penalty-agreement', async (req, res) => {
  try {
    const { poolId, userId } = req.params;
    const { agreed } = req.body;

    // Verify pool requires consensus
    const pool = await db.get(`
      SELECT * FROM pools 
      WHERE id = ? AND penalty_enabled = 1 AND penalty_requires_consensus = 1
    `, [poolId]);

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found or consensus not required' });
    }

    // Update member agreement
    await db.run(`
      UPDATE pool_memberships 
      SET penalty_agreed = ?, penalty_agreed_at = ?
      WHERE pool_id = ? AND user_id = ?
    `, [agreed ? 1 : 0, new Date().toISOString(), poolId, userId]);

    // Check if all members have now agreed
    const allMembers = await db.get(`
      SELECT COUNT(*) as total_members FROM pool_memberships 
      WHERE pool_id = ?
    `, [poolId]);

    const agreedMembers = await db.get(`
      SELECT COUNT(*) as agreed_members FROM pool_memberships 
      WHERE pool_id = ? AND penalty_agreed = 1
    `, [poolId]);

    const allAgreed = agreedMembers.agreed_members === allMembers.total_members;

    res.json({
      success: true,
      userAgreed: agreed,
      allMembersAgreed: allAgreed,
      agreedCount: agreedMembers.agreed_members,
      totalMembers: allMembers.total_members
    });

  } catch (error) {
    console.error('Update penalty agreement error:', error);
    res.status(500).json({ error: 'Failed to update penalty agreement' });
  }
});

// Get penalty agreement status for a pool
router.get('/pools/:poolId/penalty-status', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const pool = await db.get(`
      SELECT penalty_enabled, penalty_percentage, penalty_requires_consensus, pool_type
      FROM pools WHERE id = ?
    `, [poolId]);

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    if (!pool.penalty_enabled) {
      return res.json({
        penaltyEnabled: false,
        message: 'No penalties configured for this pool'
      });
    }

    const members = await db.all(`
      SELECT u.name, pm.penalty_agreed, pm.penalty_agreed_at
      FROM pool_memberships pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.pool_id = ?
    `, [poolId]);

    const agreedCount = members.filter(m => m.penalty_agreed).length;
    const allAgreed = agreedCount === members.length;

    res.json({
      penaltyEnabled: true,
      penaltyPercentage: pool.penalty_percentage,
      requiresConsensus: pool.penalty_requires_consensus,
      poolType: pool.pool_type,
      members: members.map(m => ({
        name: m.name,
        agreed: !!m.penalty_agreed,
        agreedAt: m.penalty_agreed_at
      })),
      agreedCount,
      totalMembers: members.length,
      allMembersAgreed: allAgreed,
      penaltyActive: pool.pool_type === 'solo' || allAgreed
    });

  } catch (error) {
    console.error('Get penalty status error:', error);
    res.status(500).json({ error: 'Failed to get penalty status' });
  }
});

module.exports = router;
