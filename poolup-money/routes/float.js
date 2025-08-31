const express = require('express');
const Decimal = require('decimal.js');
const cron = require('node-cron');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Float revenue configuration
const FLOAT_INTEREST_RATE = new Decimal(process.env.FLOAT_INTEREST_RATE || 0.045); // 4.5% APY
const USER_INTEREST_RATE = new Decimal(0.02); // 2% APY for users
const POOLUP_REVENUE_RATE = FLOAT_INTEREST_RATE.minus(USER_INTEREST_RATE); // 2.5% revenue

// Calculate daily float revenue
async function calculateDailyFloatRevenue() {
  const db = getDatabase();
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already calculated for today
    const existingCalculation = await db.get(
      'SELECT * FROM float_revenue WHERE calculation_date = ?',
      [today]
    );
    
    if (existingCalculation) {
      logger.info('Float revenue already calculated for today');
      return existingCalculation;
    }
    
    // Get total user balances
    const totalBalanceResult = await db.get(`
      SELECT COALESCE(SUM(balance), 0) as total_balance
      FROM poolup_accounts 
      WHERE status = 'active' AND balance > ?
    `, [process.env.MINIMUM_BALANCE_FOR_INTEREST || 1.00]);
    
    const totalUserBalance = new Decimal(totalBalanceResult.total_balance);
    
    if (totalUserBalance.eq(0)) {
      logger.info('No eligible balances for float revenue calculation');
      return null;
    }
    
    // Calculate daily revenue (APY / 365)
    const dailyRate = POOLUP_REVENUE_RATE.div(365);
    const dailyRevenue = totalUserBalance.mul(dailyRate);
    
    // Get previous cumulative revenue
    const previousRevenue = await db.get(`
      SELECT COALESCE(cumulative_revenue, 0) as cumulative
      FROM float_revenue 
      ORDER BY calculation_date DESC 
      LIMIT 1
    `);
    
    const cumulativeRevenue = dailyRevenue.plus(new Decimal(previousRevenue?.cumulative || 0));
    
    // Store calculation
    await db.run(`
      INSERT INTO float_revenue (
        calculation_date, total_user_balance, interest_rate, 
        daily_revenue, cumulative_revenue
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      today, 
      totalUserBalance.toString(), 
      POOLUP_REVENUE_RATE.toString(),
      dailyRevenue.toString(), 
      cumulativeRevenue.toString()
    ]);
    
    logger.info(`Float revenue calculated: $${dailyRevenue.toString()} (Total: $${cumulativeRevenue.toString()})`);
    
    return {
      calculation_date: today,
      total_user_balance: totalUserBalance.toString(),
      daily_revenue: dailyRevenue.toString(),
      cumulative_revenue: cumulativeRevenue.toString()
    };
    
  } catch (error) {
    logger.error('Error calculating float revenue:', error);
    throw error;
  }
}

// Calculate and distribute user interest
async function calculateUserInterest() {
  const db = getDatabase();
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all eligible accounts
    const accounts = await db.all(`
      SELECT user_id, balance
      FROM poolup_accounts 
      WHERE status = 'active' AND balance >= ?
    `, [process.env.MINIMUM_BALANCE_FOR_INTEREST || 1.00]);
    
    const dailyUserRate = USER_INTEREST_RATE.div(365);
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      for (const account of accounts) {
        const balance = new Decimal(account.balance);
        const dailyInterest = balance.mul(dailyUserRate);
        
        // Check if already calculated for this user today
        const existingInterest = await db.get(
          'SELECT * FROM user_interest WHERE user_id = ? AND calculation_date = ?',
          [account.user_id, today]
        );
        
        if (existingInterest) {
          continue;
        }
        
        // Get previous cumulative interest
        const previousInterest = await db.get(`
          SELECT COALESCE(cumulative_interest, 0) as cumulative
          FROM user_interest 
          WHERE user_id = ?
          ORDER BY calculation_date DESC 
          LIMIT 1
        `, [account.user_id]);
        
        const cumulativeInterest = dailyInterest.plus(new Decimal(previousInterest?.cumulative || 0));
        
        // Store user interest calculation
        await db.run(`
          INSERT INTO user_interest (
            user_id, calculation_date, balance, interest_rate,
            daily_interest, cumulative_interest
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          account.user_id, today, balance.toString(), USER_INTEREST_RATE.toString(),
          dailyInterest.toString(), cumulativeInterest.toString()
        ]);
        
        // Update user's interest earned in poolup_accounts
        await db.run(`
          UPDATE poolup_accounts 
          SET interest_earned = interest_earned + ?, 
              last_interest_calculation = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [dailyInterest.toString(), account.user_id]);
      }
      
      await db.run('COMMIT');
      
      logger.info(`User interest calculated for ${accounts.length} accounts`);
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error calculating user interest:', error);
    throw error;
  }
}

// Schedule daily calculations (runs at 2 AM daily)
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting daily float revenue and interest calculations');
  
  try {
    await calculateDailyFloatRevenue();
    await calculateUserInterest();
    logger.info('Daily calculations completed successfully');
  } catch (error) {
    logger.error('Daily calculations failed:', error);
  }
});

// Get float revenue analytics
router.get('/revenue/analytics', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    
    const analytics = await db.all(`
      SELECT 
        calculation_date,
        total_user_balance,
        daily_revenue,
        cumulative_revenue
      FROM float_revenue 
      WHERE calculation_date >= DATE('now', '-${days} days')
      ORDER BY calculation_date DESC
    `);
    
    // Calculate summary statistics
    const totalRevenue = analytics.reduce((sum, day) => 
      sum + parseFloat(day.daily_revenue), 0
    );
    
    const avgDailyRevenue = analytics.length > 0 ? totalRevenue / analytics.length : 0;
    const projectedMonthlyRevenue = avgDailyRevenue * 30;
    const projectedAnnualRevenue = avgDailyRevenue * 365;
    
    res.json({
      success: true,
      analytics: {
        period_days: days,
        total_revenue: totalRevenue.toFixed(2),
        avg_daily_revenue: avgDailyRevenue.toFixed(2),
        projected_monthly_revenue: projectedMonthlyRevenue.toFixed(2),
        projected_annual_revenue: projectedAnnualRevenue.toFixed(2),
        daily_data: analytics
      }
    });
    
  } catch (error) {
    logger.error('Error fetching float analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Get user interest summary
router.get('/user-interest', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    
    // Get current balance and total interest earned
    const account = await db.get(
      'SELECT balance, interest_earned, last_interest_calculation FROM poolup_accounts WHERE user_id = ?',
      [user_id]
    );
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'PoolUp account not found'
      });
    }
    
    // Get interest history
    const interestHistory = await db.all(`
      SELECT 
        calculation_date,
        balance,
        daily_interest,
        cumulative_interest
      FROM user_interest 
      WHERE user_id = ?
      ORDER BY calculation_date DESC
      LIMIT 30
    `, [user_id]);
    
    // Calculate projected earnings
    const currentBalance = new Decimal(account.balance);
    const dailyRate = USER_INTEREST_RATE.div(365);
    const projectedDailyInterest = currentBalance.mul(dailyRate);
    const projectedMonthlyInterest = projectedDailyInterest.mul(30);
    const projectedAnnualInterest = projectedDailyInterest.mul(365);
    
    res.json({
      success: true,
      interest_summary: {
        current_balance: account.balance,
        total_interest_earned: account.interest_earned,
        interest_rate: USER_INTEREST_RATE.toString(),
        last_calculation: account.last_interest_calculation,
        projected: {
          daily: projectedDailyInterest.toFixed(6),
          monthly: projectedMonthlyInterest.toFixed(2),
          annual: projectedAnnualInterest.toFixed(2)
        },
        history: interestHistory
      }
    });
    
  } catch (error) {
    logger.error('Error fetching user interest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interest data'
    });
  }
});

// Manual calculation trigger (admin only)
router.post('/calculate/manual', async (req, res) => {
  try {
    // Note: In production, add admin authentication middleware
    
    const floatRevenue = await calculateDailyFloatRevenue();
    await calculateUserInterest();
    
    res.json({
      success: true,
      message: 'Manual calculation completed',
      float_revenue: floatRevenue
    });
    
  } catch (error) {
    logger.error('Error in manual calculation:', error);
    res.status(500).json({
      success: false,
      error: 'Manual calculation failed'
    });
  }
});

// Get float revenue rates and configuration
router.get('/rates', (req, res) => {
  res.json({
    success: true,
    rates: {
      float_interest_rate: FLOAT_INTEREST_RATE.toString(),
      user_interest_rate: USER_INTEREST_RATE.toString(),
      poolup_revenue_rate: POOLUP_REVENUE_RATE.toString(),
      minimum_balance_for_interest: process.env.MINIMUM_BALANCE_FOR_INTEREST || '1.00',
      calculation_frequency: 'daily'
    }
  });
});

// Get total platform metrics (admin)
router.get('/platform/metrics', async (req, res) => {
  const db = getDatabase();
  
  try {
    // Total user balances
    const totalBalances = await db.get(`
      SELECT 
        COUNT(*) as total_accounts,
        COALESCE(SUM(balance), 0) as total_balance,
        COALESCE(SUM(interest_earned), 0) as total_interest_paid
      FROM poolup_accounts 
      WHERE status = 'active'
    `);
    
    // Latest float revenue
    const latestRevenue = await db.get(`
      SELECT * FROM float_revenue 
      ORDER BY calculation_date DESC 
      LIMIT 1
    `);
    
    // Monthly revenue
    const monthlyRevenue = await db.get(`
      SELECT COALESCE(SUM(daily_revenue), 0) as monthly_total
      FROM float_revenue 
      WHERE calculation_date >= DATE('now', 'start of month')
    `);
    
    res.json({
      success: true,
      platform_metrics: {
        total_accounts: totalBalances.total_accounts,
        total_user_balance: totalBalances.total_balance,
        total_interest_paid: totalBalances.total_interest_paid,
        latest_daily_revenue: latestRevenue?.daily_revenue || '0.00',
        cumulative_revenue: latestRevenue?.cumulative_revenue || '0.00',
        monthly_revenue: monthlyRevenue.monthly_total,
        last_calculation: latestRevenue?.calculation_date
      }
    });
    
  } catch (error) {
    logger.error('Error fetching platform metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform metrics'
    });
  }
});

module.exports = router;
