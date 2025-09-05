import express, { Request, Response } from 'express';
import db from './db';
import { AuthenticatedRequest } from './auth-middleware';

interface WithdrawalRequest {
  userId: string;
  amountCents: number;
  reason?: string;
}

interface Pool {
  id: string;
  trip_date?: string;
  penalty_enabled: boolean;
  penalty_percentage: number;
  pool_type: string;
  penalty_requires_consensus?: boolean;
  [key: string]: any;
}

interface Membership {
  pool_id: string;
  user_id: string;
  total_contributed_cents: number;
  [key: string]: any;
}

const router = express.Router();

// Calculate withdrawal penalty based on pool settings and timing
function calculateWithdrawalPenalty(pool: Pool, amountCents: number): number {
  if (!pool.penalty_enabled) {
    return 0;
  }

  const now = new Date();
  const tripDate = pool.trip_date ? new Date(pool.trip_date) : new Date();
  
  // If withdrawal is after trip date, no penalty
  if (now >= tripDate) {
    return 0;
  }

  const penaltyPercentage = pool.penalty_percentage || 0.1; // Default 10%
  return Math.floor(amountCents * penaltyPercentage);
}

// Create withdrawal request with penalty calculation
router.post('/pools/:poolId/withdraw', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { poolId } = req.params;
    const { userId, amountCents, reason }: WithdrawalRequest = req.body;
    
    if (!userId || !amountCents || amountCents <= 0) {
      res.status(400).json({ error: 'Valid userId and amountCents required' });
      return;
    }

    // Get pool details including penalty settings
    const pool = db.prepare(`
      SELECT * FROM pools 
      WHERE id = ?
    `).get(poolId) as Pool | undefined;

    if (!pool) {
      res.status(404).json({ error: 'Pool not found' });
      return;
    }

    // Check if user is member of the pool
    const membership = db.prepare(`
      SELECT * FROM memberships 
      WHERE pool_id = ? AND user_id = ?
    `).get(poolId, userId) as Membership | undefined;

    if (!membership) {
      res.status(403).json({ error: 'User not a member of this pool' });
      return;
    }

    // Calculate penalty if withdrawing before target date
    let penaltyAmount = 0;
    let isPenaltyApplicable = false;

    if (pool.trip_date && pool.penalty_enabled) {
      const targetDate = new Date(pool.trip_date);
      const currentDate = new Date();
      
      if (currentDate < targetDate) {
        isPenaltyApplicable = true;
        penaltyAmount = Math.round(amountCents * ((pool.penalty_percentage || 10) / 100));
      }
    }

    // For group pools, check if all members agreed to penalties
    if (pool.pool_type === 'group' && pool.penalty_requires_consensus) {
      const allMembers = db.prepare(`
        SELECT COUNT(*) as total_members FROM memberships 
        WHERE pool_id = ?
      `).get(poolId) as any;

      const agreedMembers = db.prepare(`
        SELECT COUNT(*) as agreed_members FROM memberships 
        WHERE pool_id = ? AND penalty_agreed = 1
      `).get(poolId) as any;

      if (agreedMembers.agreed_members !== allMembers.total_members) {
        res.status(400).json({ 
          error: 'All group members must agree to penalty system before withdrawals can be penalized' 
        });
        return;
      }
    }

    // Record the withdrawal request
    const withdrawalId = `withdrawal_${Date.now()}_${userId}`;
    db.prepare(`
      INSERT INTO transactions (id, pool_id, user_id, type, amount_cents, status, description, created_at)
      VALUES (?, ?, ?, 'withdrawal', ?, 'pending', ?, datetime('now'))
    `).run(withdrawalId, poolId, userId, amountCents, reason || 'User withdrawal request');

    res.json({
      withdrawalId,
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

// Get withdrawal history for a pool
router.get('/pools/:poolId/withdrawals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { poolId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const withdrawals = db.prepare(`
      SELECT t.*, u.name as user_name, p.amount_cents as penalty_amount
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN penalties p ON t.user_id = p.user_id AND t.pool_id = p.pool_id
      WHERE t.pool_id = ? AND t.type = 'withdrawal'
      ORDER BY t.created_at DESC
    `).all(poolId) as any[];

    const formattedWithdrawals = withdrawals.map((w: any) => ({
      id: w.id,
      userId: w.user_id,
      userName: w.user_name,
      amount: w.amount_cents,
      penalty: w.penalty_amount || 0,
      reason: w.description,
      date: w.created_at
    }));

    res.json({ withdrawals: formattedWithdrawals });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get withdrawal history for a user
router.get('/users/:userId/withdrawals', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const withdrawals = db.prepare(`
      SELECT t.*, p.name as pool_name, p.penalty_percentage
      FROM transactions t
      JOIN pools p ON t.pool_id = p.id
      WHERE t.user_id = ? AND t.type = 'withdrawal'
      ORDER BY t.created_at DESC
    `).all(userId);

    res.json({ withdrawals });
  } catch (error) {
    console.error('Error fetching user withdrawals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update pool member penalty agreement (for group pools)
router.post('/pools/:poolId/members/:userId/penalty-agreement', async (req: Request, res: Response) => {
  try {
    const { poolId, userId } = req.params;
    const { agreed } = req.body;

    // Verify pool requires consensus
    const pool = db.prepare(`
      SELECT penalty_requires_consensus FROM pools WHERE id = ?
    `).get(poolId) as any;

    if (!pool || !pool.penalty_requires_consensus) {
      return res.status(400).json({ error: 'Pool does not require penalty consensus' });
    }

    // Update member agreement
    db.prepare(`
      UPDATE memberships 
      SET penalty_agreed = ?
      WHERE pool_id = ? AND user_id = ?
    `).run(agreed ? 1 : 0, poolId, userId);

    // Get updated counts
    const allMembers = db.prepare(`
      SELECT COUNT(*) as total_members FROM memberships WHERE pool_id = ?
    `).get(poolId) as any;

    const agreedMembers = db.prepare(`
      SELECT COUNT(*) as agreed_members FROM memberships 
      WHERE pool_id = ? AND penalty_agreed = 1
    `).get(poolId) as any;

    res.json({
      success: true,
      agreed,
      agreedCount: agreedMembers.agreed_members,
      totalMembers: allMembers.total_members
    });

  } catch (error) {
    console.error('Update penalty agreement error:', error);
    res.status(500).json({ error: 'Failed to update penalty agreement' });
  }
});

// Get penalty agreement status for pool
router.get('/pools/:poolId/penalty-agreement', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { poolId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allMembers = db.prepare(`
      SELECT COUNT(*) as total FROM memberships WHERE pool_id = ?
    `).get(poolId) as any;

    const agreedMembers = db.prepare(`
      SELECT COUNT(*) as agreed FROM memberships 
      WHERE pool_id = ? AND penalty_agreed = 1
    `).get(poolId) as any;

    const agreementPercentage = (agreedMembers.agreed / allMembers.total) * 100;
    const isFullyAgreed = agreementPercentage === 100;

    res.json({
      totalMembers: allMembers.total,
      agreedMembers: agreedMembers.agreed,
      agreementPercentage,
      isFullyAgreed
    });
  } catch (error) {
    console.error('Error fetching penalty agreement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate penalty for early withdrawal
router.post('/calculate-penalty', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { poolId, amountCents } = req.body;
    const userId = req.user?.id;

    if (!userId || !poolId || !amountCents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare('SELECT * FROM pools WHERE id = ?');
    const pool = stmt.get(poolId) as Pool;

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    const penalty = calculateWithdrawalPenalty(pool, amountCents);
    res.json({ penalty });
  } catch (error) {
    console.error('Error calculating penalty:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get penalty status for a pool
router.get('/pools/:poolId/penalty-status', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.params;
    
    const pool = db.prepare(`
      SELECT penalty_enabled, penalty_percentage, penalty_requires_consensus, pool_type, trip_date
      FROM pools WHERE id = ?
    `).get(poolId) as Pool | undefined;

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    const now = new Date();
    const tripDate = pool.trip_date ? new Date(pool.trip_date) : new Date();
    const daysUntilTrip = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let penaltyRate = 0;
    if (daysUntilTrip > 30) {
      penaltyRate = 0.05; // 5%
    } else if (daysUntilTrip > 7) {
      penaltyRate = 0.15; // 15%
    } else {
      penaltyRate = 0.25; // 25%
    }

    const members = db.prepare(`
      SELECT m.*, u.name 
      FROM memberships m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.pool_id = ?
    `).all(poolId) as any[];

    const totalMembers = members.length;
    const agreedCount = members.filter((m: any) => m.penalty_agreed).length;
    const agreementPercentage = totalMembers > 0 ? (agreedCount / totalMembers) * 100 : 0;

    res.json({
      poolId,
      daysUntilTrip,
      penaltyRate,
      totalMembers,
      agreedCount,
      agreementPercentage,
      members: members.map((m: any) => ({
        userId: m.user_id,
        name: m.name,
        agreed: m.penalty_agreed || false
      }))
    });
  } catch (error) {
    console.error('Error fetching penalty status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
export default router;
