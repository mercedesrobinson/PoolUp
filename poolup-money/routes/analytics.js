const express = require('express');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Get user financial analytics
router.get('/user/financial', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    const { period = '30' } = req.query;
    const days = parseInt(period);
    
    // Get PoolUp account balance
    const account = await db.get(
      'SELECT balance, interest_earned FROM poolup_accounts WHERE user_id = ?',
      [user_id]
    );
    
    // Get transaction summary
    const transactionSummary = await db.get(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
        COALESCE(SUM(CASE WHEN transaction_type = 'pool_contribution' THEN amount ELSE 0 END), 0) as total_pool_contributions
      FROM transactions 
      WHERE user_id = ? AND DATE(created_at) >= DATE('now', '-${days} days')
    `, [user_id]);
    
    // Get pool participation
    const poolStats = await db.get(`
      SELECT 
        COUNT(*) as active_pools,
        COALESCE(SUM(total_contributed), 0) as total_contributed_all_pools
      FROM pool_memberships pm
      JOIN savings_pools sp ON pm.pool_id = sp.pool_id
      WHERE pm.user_id = ? AND pm.status = 'active' AND sp.status = 'active'
    `, [user_id]);
    
    // Get recent transactions
    const recentTransactions = await db.all(`
      SELECT 
        transaction_id,
        amount,
        transaction_type,
        description,
        created_at
      FROM transactions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [user_id]);
    
    res.json({
      success: true,
      analytics: {
        account_balance: account?.balance || '0.00',
        interest_earned: account?.interest_earned || '0.00',
        period_days: days,
        transaction_summary: transactionSummary,
        pool_participation: poolStats,
        recent_transactions: recentTransactions
      }
    });
    
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Get pool analytics
router.get('/pools/:pool_id', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { pool_id } = req.params;
    const user_id = req.user.user_id;
    
    // Verify user is member of pool
    const membership = await db.get(
      'SELECT * FROM pool_memberships WHERE pool_id = ? AND user_id = ?',
      [pool_id, user_id]
    );
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this pool'
      });
    }
    
    // Get pool details with analytics
    const poolAnalytics = await db.get(`
      SELECT 
        sp.*,
        (sp.current_amount / sp.goal_amount * 100) as progress_percentage,
        (SELECT COUNT(*) FROM pool_memberships WHERE pool_id = sp.pool_id AND status = 'active') as member_count,
        (SELECT COUNT(*) FROM transactions WHERE pool_id = sp.pool_id AND transaction_type = 'pool_contribution') as total_contributions,
        (SELECT AVG(amount) FROM transactions WHERE pool_id = sp.pool_id AND transaction_type = 'pool_contribution') as avg_contribution
      FROM savings_pools sp
      WHERE sp.pool_id = ?
    `, [pool_id]);
    
    // Get contribution timeline
    const contributionTimeline = await db.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as contribution_count,
        SUM(amount) as daily_total
      FROM transactions 
      WHERE pool_id = ? AND transaction_type = 'pool_contribution'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [pool_id]);
    
    // Get member contributions
    const memberContributions = await db.all(`
      SELECT 
        pm.user_id,
        u.first_name || ' ' || u.last_name as member_name,
        pm.total_contributed,
        pm.contribution_amount,
        (SELECT COUNT(*) FROM transactions WHERE user_id = pm.user_id AND pool_id = pm.pool_id AND transaction_type = 'pool_contribution') as contribution_count
      FROM pool_memberships pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.pool_id = ? AND pm.status = 'active'
      ORDER BY pm.total_contributed DESC
    `, [pool_id]);
    
    res.json({
      success: true,
      pool_analytics: {
        ...poolAnalytics,
        contribution_timeline: contributionTimeline,
        member_contributions: memberContributions
      }
    });
    
  } catch (error) {
    logger.error('Error fetching pool analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool analytics'
    });
  }
});

// Get platform-wide analytics (admin only)
router.get('/platform/overview', async (req, res) => {
  const db = getDatabase();
  
  try {
    // Note: Add admin authentication in production
    
    // User metrics
    const userMetrics = await db.get(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN kyc_status = 'verified' THEN 1 END) as verified_users,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as new_users_30d
      FROM users
    `);
    
    // Pool metrics
    const poolMetrics = await db.get(`
      SELECT 
        COUNT(*) as total_pools,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_pools,
        COALESCE(SUM(current_amount), 0) as total_pool_value,
        COALESCE(AVG(current_amount / goal_amount * 100), 0) as avg_completion_rate
      FROM savings_pools
    `);
    
    // Financial metrics
    const financialMetrics = await db.get(`
      SELECT 
        COALESCE(SUM(balance), 0) as total_user_balance,
        COALESCE(SUM(interest_earned), 0) as total_interest_paid,
        COUNT(*) as total_accounts
      FROM poolup_accounts 
      WHERE status = 'active'
    `);
    
    // Transaction volume
    const transactionVolume = await db.get(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_volume,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as transactions_30d,
        COALESCE(SUM(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN amount ELSE 0 END), 0) as volume_30d
      FROM transactions
    `);
    
    // Float revenue
    const floatRevenue = await db.get(`
      SELECT 
        COALESCE(cumulative_revenue, 0) as total_revenue,
        COALESCE(SUM(CASE WHEN calculation_date >= DATE('now', '-30 days') THEN daily_revenue ELSE 0 END), 0) as revenue_30d
      FROM float_revenue 
      ORDER BY calculation_date DESC 
      LIMIT 1
    `);
    
    res.json({
      success: true,
      platform_analytics: {
        users: userMetrics,
        pools: poolMetrics,
        financial: financialMetrics,
        transactions: transactionVolume,
        float_revenue: floatRevenue,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error fetching platform analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform analytics'
    });
  }
});

module.exports = router;
