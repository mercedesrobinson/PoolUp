const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const transferSchema = Joi.object({
  from_account_id: Joi.string().required(),
  to_account_id: Joi.string().required(),
  amount: Joi.number().positive().required(),
  transfer_type: Joi.string().valid('deposit', 'withdrawal', 'pool_contribution', 'pool_distribution').required(),
  pool_id: Joi.string().optional(),
  scheduled_date: Joi.date().optional()
});

const bulkTransferSchema = Joi.object({
  transfers: Joi.array().items(transferSchema).min(1).max(100).required()
});

// ACH transfer limits
const DAILY_LIMIT = new Decimal(process.env.ACH_DAILY_LIMIT || 10000);
const MONTHLY_LIMIT = new Decimal(process.env.ACH_MONTHLY_LIMIT || 50000);
const PROCESSING_FEE = new Decimal(process.env.ACH_PROCESSING_FEE || 0.25);

// Create ACH transfer
router.post('/ach', validateRequest(transferSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const { from_account_id, to_account_id, amount, transfer_type, pool_id, scheduled_date } = req.body;
    const user_id = req.user.user_id;
    const transferAmount = new Decimal(amount);
    
    // Validate transfer limits
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const dailyTotal = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ach_transfers 
      WHERE user_id = ? AND DATE(created_at) = ? AND status IN ('pending', 'processing', 'completed')
    `, [user_id, today]);
    
    const monthlyTotal = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ach_transfers 
      WHERE user_id = ? AND DATE(created_at) >= ? AND status IN ('pending', 'processing', 'completed')
    `, [user_id, monthStart]);
    
    if (new Decimal(dailyTotal.total).plus(transferAmount).gt(DAILY_LIMIT)) {
      return res.status(400).json({
        success: false,
        error: 'Daily transfer limit exceeded',
        daily_limit: DAILY_LIMIT.toString(),
        daily_used: dailyTotal.total
      });
    }
    
    if (new Decimal(monthlyTotal.total).plus(transferAmount).gt(MONTHLY_LIMIT)) {
      return res.status(400).json({
        success: false,
        error: 'Monthly transfer limit exceeded',
        monthly_limit: MONTHLY_LIMIT.toString(),
        monthly_used: monthlyTotal.total
      });
    }
    
    // Validate accounts exist and belong to user
    const fromAccount = await db.get(`
      SELECT * FROM bank_accounts 
      WHERE (account_id = ? OR account_id IN (
        SELECT account_number FROM poolup_accounts WHERE user_id = ?
      )) AND status = 'active'
    `, [from_account_id, user_id]);
    
    const toAccount = await db.get(`
      SELECT * FROM bank_accounts 
      WHERE (account_id = ? OR account_id IN (
        SELECT account_number FROM poolup_accounts WHERE user_id = ?
      )) AND status = 'active'
    `, [to_account_id, user_id]);
    
    if (!fromAccount && transfer_type !== 'deposit') {
      return res.status(400).json({
        success: false,
        error: 'Invalid source account'
      });
    }
    
    if (!toAccount && transfer_type !== 'withdrawal') {
      return res.status(400).json({
        success: false,
        error: 'Invalid destination account'
      });
    }
    
    // Check sufficient balance for withdrawals
    if (transfer_type === 'withdrawal' || transfer_type === 'pool_contribution') {
      const poolupAccount = await db.get(
        'SELECT balance FROM poolup_accounts WHERE user_id = ? AND status = "active"',
        [user_id]
      );
      
      if (!poolupAccount || new Decimal(poolupAccount.balance).lt(transferAmount)) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
          available_balance: poolupAccount?.balance || '0.00'
        });
      }
    }
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      const transferId = uuidv4();
      const fee = transfer_type === 'withdrawal' ? PROCESSING_FEE : new Decimal(0);
      
      // Create transfer record
      await db.run(`
        INSERT INTO ach_transfers (
          transfer_id, user_id, from_account_id, to_account_id, amount, fee,
          transfer_type, pool_id, scheduled_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transferId, user_id, from_account_id, to_account_id, 
        transferAmount.toString(), fee.toString(), transfer_type, 
        pool_id, scheduled_date || new Date().toISOString().split('T')[0], 
        'pending'
      ]);
      
      // Update balances immediately for internal transfers
      if (transfer_type === 'deposit') {
        await db.run(`
          UPDATE poolup_accounts 
          SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [transferAmount.toString(), user_id]);
      } else if (transfer_type === 'withdrawal') {
        const totalDeduction = transferAmount.plus(fee);
        await db.run(`
          UPDATE poolup_accounts 
          SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [totalDeduction.toString(), user_id]);
      }
      
      // Create transaction record
      await db.run(`
        INSERT INTO transactions (
          transaction_id, user_id, account_id, pool_id, amount, 
          transaction_type, description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), user_id, 
        transfer_type === 'deposit' ? to_account_id : from_account_id,
        pool_id, transferAmount.toString(), transfer_type,
        `ACH ${transfer_type} - ${transferId}`, 'completed'
      ]);
      
      await db.run('COMMIT');
      
      logger.info(`ACH transfer created: ${transferId} for user ${user_id}`);
      
      res.json({
        success: true,
        transfer_id: transferId,
        amount: transferAmount.toString(),
        fee: fee.toString(),
        status: 'pending',
        estimated_completion: getEstimatedCompletion()
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error creating ACH transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transfer'
    });
  }
});

// Bulk transfers for pool operations
router.post('/bulk', validateRequest(bulkTransferSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const { transfers } = req.body;
    const user_id = req.user.user_id;
    const results = [];
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      for (const transfer of transfers) {
        const transferId = uuidv4();
        const transferAmount = new Decimal(transfer.amount);
        const fee = transfer.transfer_type === 'withdrawal' ? PROCESSING_FEE : new Decimal(0);
        
        await db.run(`
          INSERT INTO ach_transfers (
            transfer_id, user_id, from_account_id, to_account_id, amount, fee,
            transfer_type, pool_id, scheduled_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          transferId, user_id, transfer.from_account_id, transfer.to_account_id,
          transferAmount.toString(), fee.toString(), transfer.transfer_type,
          transfer.pool_id, transfer.scheduled_date || new Date().toISOString().split('T')[0],
          'pending'
        ]);
        
        results.push({
          transfer_id: transferId,
          amount: transferAmount.toString(),
          fee: fee.toString(),
          status: 'pending'
        });
      }
      
      await db.run('COMMIT');
      
      res.json({
        success: true,
        transfers: results,
        total_transfers: results.length
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error creating bulk transfers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk transfers'
    });
  }
});

// Get transfer history
router.get('/history', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    const { limit = 50, offset = 0, status, transfer_type } = req.query;
    
    let query = `
      SELECT 
        at.*,
        sp.name as pool_name
      FROM ach_transfers at
      LEFT JOIN savings_pools sp ON at.pool_id = sp.pool_id
      WHERE at.user_id = ?
    `;
    const params = [user_id];
    
    if (status) {
      query += ' AND at.status = ?';
      params.push(status);
    }
    
    if (transfer_type) {
      query += ' AND at.transfer_type = ?';
      params.push(transfer_type);
    }
    
    query += ' ORDER BY at.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const transfers = await db.all(query, params);
    
    res.json({
      success: true,
      transfers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: transfers.length
      }
    });
    
  } catch (error) {
    logger.error('Error fetching transfer history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfer history'
    });
  }
});

// Get transfer status
router.get('/:transfer_id/status', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { transfer_id } = req.params;
    const user_id = req.user.user_id;
    
    const transfer = await db.get(`
      SELECT at.*, sp.name as pool_name
      FROM ach_transfers at
      LEFT JOIN savings_pools sp ON at.pool_id = sp.pool_id
      WHERE at.transfer_id = ? AND at.user_id = ?
    `, [transfer_id, user_id]);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }
    
    res.json({
      success: true,
      transfer
    });
    
  } catch (error) {
    logger.error('Error fetching transfer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfer status'
    });
  }
});

// Cancel pending transfer
router.post('/:transfer_id/cancel', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { transfer_id } = req.params;
    const user_id = req.user.user_id;
    
    const transfer = await db.get(
      'SELECT * FROM ach_transfers WHERE transfer_id = ? AND user_id = ? AND status = "pending"',
      [transfer_id, user_id]
    );
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found or cannot be cancelled'
      });
    }
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Update transfer status
      await db.run(
        'UPDATE ach_transfers SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE transfer_id = ?',
        [transfer_id]
      );
      
      // Reverse balance changes if needed
      if (transfer.transfer_type === 'deposit') {
        await db.run(`
          UPDATE poolup_accounts 
          SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [transfer.amount, user_id]);
      } else if (transfer.transfer_type === 'withdrawal') {
        const totalRefund = new Decimal(transfer.amount).plus(new Decimal(transfer.fee));
        await db.run(`
          UPDATE poolup_accounts 
          SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [totalRefund.toString(), user_id]);
      }
      
      await db.run('COMMIT');
      
      res.json({
        success: true,
        message: 'Transfer cancelled successfully'
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error cancelling transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel transfer'
    });
  }
});

// Get transfer limits
router.get('/limits', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const dailyUsed = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ach_transfers 
      WHERE user_id = ? AND DATE(created_at) = ? AND status IN ('pending', 'processing', 'completed')
    `, [user_id, today]);
    
    const monthlyUsed = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ach_transfers 
      WHERE user_id = ? AND DATE(created_at) >= ? AND status IN ('pending', 'processing', 'completed')
    `, [user_id, monthStart]);
    
    res.json({
      success: true,
      limits: {
        daily: {
          limit: DAILY_LIMIT.toString(),
          used: dailyUsed.total,
          remaining: DAILY_LIMIT.minus(new Decimal(dailyUsed.total)).toString()
        },
        monthly: {
          limit: MONTHLY_LIMIT.toString(),
          used: monthlyUsed.total,
          remaining: MONTHLY_LIMIT.minus(new Decimal(monthlyUsed.total)).toString()
        },
        processing_fee: PROCESSING_FEE.toString()
      }
    });
    
  } catch (error) {
    logger.error('Error fetching transfer limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfer limits'
    });
  }
});

function getEstimatedCompletion() {
  const now = new Date();
  const completion = new Date(now);
  completion.setDate(completion.getDate() + 3); // 3 business days
  return completion.toISOString().split('T')[0];
}

module.exports = router;
