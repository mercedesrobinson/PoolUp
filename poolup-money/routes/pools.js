const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createPoolSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  goal_amount: Joi.number().positive().required(),
  contribution_frequency: Joi.string().valid('daily', 'weekly', 'biweekly', 'monthly').required(),
  contribution_amount: Joi.number().positive().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().greater(Joi.ref('start_date')).required(),
  pool_type: Joi.string().valid('group', 'solo').default('group'),
  max_members: Joi.number().integer().min(2).max(50).default(10),
  auto_contribute: Joi.boolean().default(true)
});

const joinPoolSchema = Joi.object({
  contribution_amount: Joi.number().positive().required(),
  auto_contribute: Joi.boolean().default(true)
});

const contributeSchema = Joi.object({
  amount: Joi.number().positive().required(),
  source_account_id: Joi.string().required()
});

// Create savings pool
router.post('/', validateRequest(createPoolSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const {
      name, description, goal_amount, contribution_frequency, contribution_amount,
      start_date, end_date, pool_type, max_members, auto_contribute
    } = req.body;
    const creator_id = req.user.user_id;
    const pool_id = uuidv4();
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    
    if (startDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be in the past'
      });
    }
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Create pool
      await db.run(`
        INSERT INTO savings_pools (
          pool_id, creator_id, name, description, goal_amount, 
          contribution_frequency, contribution_amount, start_date, end_date,
          pool_type, max_members, auto_contribute
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pool_id, creator_id, name, description, goal_amount,
        contribution_frequency, contribution_amount, start_date, end_date,
        pool_type, max_members, auto_contribute
      ]);
      
      // Add creator as first member
      await db.run(`
        INSERT INTO pool_memberships (
          pool_id, user_id, contribution_amount, auto_contribute
        ) VALUES (?, ?, ?, ?)
      `, [pool_id, creator_id, contribution_amount, auto_contribute]);
      
      // Create initial transaction record
      await db.run(`
        INSERT INTO transactions (
          transaction_id, user_id, pool_id, amount, transaction_type, 
          description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), creator_id, pool_id, 0, 'pool_created',
        `Created savings pool: ${name}`, 'completed'
      ]);
      
      await db.run('COMMIT');
      
      logger.info(`Savings pool created: ${pool_id} by user ${creator_id}`);
      
      res.json({
        success: true,
        pool_id,
        message: 'Savings pool created successfully',
        pool: {
          pool_id,
          name,
          description,
          goal_amount,
          contribution_frequency,
          contribution_amount,
          start_date,
          end_date,
          pool_type,
          max_members,
          creator_id,
          current_amount: 0,
          member_count: 1
        }
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error creating savings pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create savings pool'
    });
  }
});

// Join existing pool
router.post('/:pool_id/join', validateRequest(joinPoolSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const { pool_id } = req.params;
    const { contribution_amount, auto_contribute } = req.body;
    const user_id = req.user.user_id;
    
    // Check if pool exists and is active
    const pool = await db.get(
      'SELECT * FROM savings_pools WHERE pool_id = ? AND status = "active"',
      [pool_id]
    );
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found or inactive'
      });
    }
    
    // Check if user is already a member
    const existingMembership = await db.get(
      'SELECT * FROM pool_memberships WHERE pool_id = ? AND user_id = ?',
      [pool_id, user_id]
    );
    
    if (existingMembership) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this pool'
      });
    }
    
    // Check member limit
    const memberCount = await db.get(
      'SELECT COUNT(*) as count FROM pool_memberships WHERE pool_id = ? AND status = "active"',
      [pool_id]
    );
    
    if (memberCount.count >= pool.max_members) {
      return res.status(400).json({
        success: false,
        error: 'Pool is full'
      });
    }
    
    // Check if pool has started
    const today = new Date().toISOString().split('T')[0];
    if (pool.start_date <= today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot join pool after it has started'
      });
    }
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Add user to pool
      await db.run(`
        INSERT INTO pool_memberships (
          pool_id, user_id, contribution_amount, auto_contribute
        ) VALUES (?, ?, ?, ?)
      `, [pool_id, user_id, contribution_amount, auto_contribute]);
      
      // Create transaction record
      await db.run(`
        INSERT INTO transactions (
          transaction_id, user_id, pool_id, amount, transaction_type,
          description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), user_id, pool_id, 0, 'pool_joined',
        `Joined savings pool: ${pool.name}`, 'completed'
      ]);
      
      await db.run('COMMIT');
      
      logger.info(`User ${user_id} joined pool ${pool_id}`);
      
      res.json({
        success: true,
        message: 'Successfully joined savings pool',
        pool: {
          pool_id: pool.pool_id,
          name: pool.name,
          contribution_amount,
          auto_contribute
        }
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error joining pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join pool'
    });
  }
});

// Make contribution to pool
router.post('/:pool_id/contribute', validateRequest(contributeSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const { pool_id } = req.params;
    const { amount, source_account_id } = req.body;
    const user_id = req.user.user_id;
    const contributionAmount = new Decimal(amount);
    
    // Verify membership
    const membership = await db.get(`
      SELECT pm.*, sp.name as pool_name, sp.status as pool_status
      FROM pool_memberships pm
      JOIN savings_pools sp ON pm.pool_id = sp.pool_id
      WHERE pm.pool_id = ? AND pm.user_id = ? AND pm.status = 'active'
    `, [pool_id, user_id]);
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Not a member of this pool'
      });
    }
    
    if (membership.pool_status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Pool is not active'
      });
    }
    
    // Check PoolUp account balance
    const poolupAccount = await db.get(
      'SELECT balance FROM poolup_accounts WHERE user_id = ? AND status = "active"',
      [user_id]
    );
    
    if (!poolupAccount || new Decimal(poolupAccount.balance).lt(contributionAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance in PoolUp account',
        available_balance: poolupAccount?.balance || '0.00'
      });
    }
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      const transferId = uuidv4();
      
      // Create ACH transfer record
      await db.run(`
        INSERT INTO ach_transfers (
          transfer_id, user_id, from_account_id, to_account_id, amount,
          transfer_type, pool_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transferId, user_id, source_account_id, 'pool_account', 
        contributionAmount.toString(), 'pool_contribution', pool_id, 'completed'
      ]);
      
      // Update PoolUp account balance
      await db.run(`
        UPDATE poolup_accounts 
        SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [contributionAmount.toString(), user_id]);
      
      // Update pool current amount
      await db.run(`
        UPDATE savings_pools 
        SET current_amount = current_amount + ?, updated_at = CURRENT_TIMESTAMP
        WHERE pool_id = ?
      `, [contributionAmount.toString(), pool_id]);
      
      // Update member's total contributed
      await db.run(`
        UPDATE pool_memberships 
        SET total_contributed = total_contributed + ?
        WHERE pool_id = ? AND user_id = ?
      `, [contributionAmount.toString(), pool_id, user_id]);
      
      // Create transaction record
      await db.run(`
        INSERT INTO transactions (
          transaction_id, user_id, pool_id, amount, transaction_type,
          description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), user_id, pool_id, contributionAmount.toString(), 'pool_contribution',
        `Contribution to ${membership.pool_name}`, 'completed'
      ]);
      
      await db.run('COMMIT');
      
      logger.info(`Pool contribution: ${contributionAmount} to ${pool_id} by ${user_id}`);
      
      res.json({
        success: true,
        message: 'Contribution successful',
        contribution: {
          amount: contributionAmount.toString(),
          pool_id,
          transfer_id: transferId
        }
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error making pool contribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make contribution'
    });
  }
});

// Get user's pools
router.get('/my-pools', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    
    const pools = await db.all(`
      SELECT 
        sp.*,
        pm.contribution_amount as my_contribution_amount,
        pm.total_contributed,
        pm.auto_contribute,
        pm.join_date,
        (SELECT COUNT(*) FROM pool_memberships WHERE pool_id = sp.pool_id AND status = 'active') as member_count,
        (sp.current_amount / sp.goal_amount * 100) as progress_percentage
      FROM savings_pools sp
      JOIN pool_memberships pm ON sp.pool_id = pm.pool_id
      WHERE pm.user_id = ? AND pm.status = 'active'
      ORDER BY sp.created_at DESC
    `, [user_id]);
    
    res.json({
      success: true,
      pools
    });
    
  } catch (error) {
    logger.error('Error fetching user pools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pools'
    });
  }
});

// Get pool details
router.get('/:pool_id', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { pool_id } = req.params;
    const user_id = req.user.user_id;
    
    // Get pool details
    const pool = await db.get(`
      SELECT 
        sp.*,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM pool_memberships WHERE pool_id = sp.pool_id AND status = 'active') as member_count,
        (sp.current_amount / sp.goal_amount * 100) as progress_percentage
      FROM savings_pools sp
      JOIN users u ON sp.creator_id = u.user_id
      WHERE sp.pool_id = ?
    `, [pool_id]);
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found'
      });
    }
    
    // Get members
    const members = await db.all(`
      SELECT 
        pm.*,
        u.first_name || ' ' || u.last_name as member_name,
        u.user_id = ? as is_current_user
      FROM pool_memberships pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.pool_id = ? AND pm.status = 'active'
      ORDER BY pm.join_date ASC
    `, [user_id, pool_id]);
    
    // Get recent contributions
    const recentContributions = await db.all(`
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as contributor_name
      FROM transactions t
      JOIN users u ON t.user_id = u.user_id
      WHERE t.pool_id = ? AND t.transaction_type = 'pool_contribution'
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [pool_id]);
    
    res.json({
      success: true,
      pool: {
        ...pool,
        members,
        recent_contributions: recentContributions
      }
    });
    
  } catch (error) {
    logger.error('Error fetching pool details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool details'
    });
  }
});

// Leave pool
router.post('/:pool_id/leave', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { pool_id } = req.params;
    const user_id = req.user.user_id;
    
    // Check membership
    const membership = await db.get(`
      SELECT pm.*, sp.creator_id, sp.status as pool_status, sp.start_date
      FROM pool_memberships pm
      JOIN savings_pools sp ON pm.pool_id = sp.pool_id
      WHERE pm.pool_id = ? AND pm.user_id = ? AND pm.status = 'active'
    `, [pool_id, user_id]);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        error: 'Not a member of this pool'
      });
    }
    
    // Check if user is creator
    if (membership.creator_id === user_id) {
      return res.status(400).json({
        success: false,
        error: 'Pool creator cannot leave. Delete the pool instead.'
      });
    }
    
    // Check if pool has started
    const today = new Date().toISOString().split('T')[0];
    if (membership.start_date <= today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot leave pool after it has started'
      });
    }
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Update membership status
      await db.run(
        'UPDATE pool_memberships SET status = "left" WHERE pool_id = ? AND user_id = ?',
        [pool_id, user_id]
      );
      
      // Create transaction record
      await db.run(`
        INSERT INTO transactions (
          transaction_id, user_id, pool_id, amount, transaction_type,
          description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), user_id, pool_id, 0, 'pool_left',
        'Left savings pool', 'completed'
      ]);
      
      await db.run('COMMIT');
      
      res.json({
        success: true,
        message: 'Successfully left the pool'
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error leaving pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave pool'
    });
  }
});

// Get public pools (for discovery)
router.get('/discover/public', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { limit = 20, offset = 0, category } = req.query;
    
    let query = `
      SELECT 
        sp.*,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM pool_memberships WHERE pool_id = sp.pool_id AND status = 'active') as member_count,
        (sp.current_amount / sp.goal_amount * 100) as progress_percentage
      FROM savings_pools sp
      JOIN users u ON sp.creator_id = u.user_id
      WHERE sp.status = 'active' AND sp.start_date > DATE('now')
    `;
    const params = [];
    
    if (category) {
      query += ' AND sp.description LIKE ?';
      params.push(`%${category}%`);
    }
    
    query += ' ORDER BY sp.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const pools = await db.all(query, params);
    
    res.json({
      success: true,
      pools,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching public pools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public pools'
    });
  }
});

module.exports = router;
