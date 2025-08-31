const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { 
  createLinkToken, 
  exchangePublicToken, 
  getAccounts, 
  getAuthData,
  getInstitution,
  createProcessorToken 
} = require('../config/plaid');
const logger = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const linkTokenSchema = Joi.object({
  user_id: Joi.string().required()
});

const exchangeTokenSchema = Joi.object({
  public_token: Joi.string().required(),
  institution_id: Joi.string().required(),
  institution_name: Joi.string().required()
});

// Create Plaid Link token
router.post('/link/token/create', validateRequest(linkTokenSchema), async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const linkTokenData = await createLinkToken(user_id);
    
    res.json({
      success: true,
      link_token: linkTokenData.link_token,
      expiration: linkTokenData.expiration
    });
  } catch (error) {
    logger.error('Error creating link token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create link token'
    });
  }
});

// Exchange public token for access token
router.post('/link/token/exchange', validateRequest(exchangeTokenSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const { public_token, institution_id, institution_name } = req.body;
    const user_id = req.user.user_id;
    
    // Exchange public token for access token
    const exchangeData = await exchangePublicToken(public_token);
    const { access_token, item_id } = exchangeData;
    
    // Get accounts data
    const accountsData = await getAccounts(access_token);
    const authData = await getAuthData(access_token);
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Store Plaid item
      const plaidItemResult = await db.run(`
        INSERT INTO plaid_items (user_id, item_id, access_token, institution_id, institution_name)
        VALUES (?, ?, ?, ?, ?)
      `, [user_id, item_id, access_token, institution_id, institution_name]);
      
      const plaidItemId = plaidItemResult.lastID;
      
      // Store bank accounts
      const bankAccounts = [];
      for (const account of accountsData.accounts) {
        const authAccount = authData.accounts.find(a => a.account_id === account.account_id);
        
        await db.run(`
          INSERT INTO bank_accounts (
            user_id, plaid_item_id, account_id, account_name, account_type, 
            account_subtype, mask, current_balance, available_balance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user_id,
          plaidItemId,
          account.account_id,
          account.name,
          account.type,
          account.subtype,
          account.mask,
          account.balances.current || 0,
          account.balances.available || 0
        ]);
        
        bankAccounts.push({
          account_id: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balances: account.balances,
          routing_number: authAccount?.numbers?.ach?.[0]?.routing || null,
          account_number: authAccount?.numbers?.ach?.[0]?.account || null
        });
      }
      
      // Create PoolUp internal account for this user if doesn't exist
      const existingPoolUpAccount = await db.get(
        'SELECT * FROM poolup_accounts WHERE user_id = ?',
        [user_id]
      );
      
      if (!existingPoolUpAccount) {
        const accountNumber = `PU${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        await db.run(`
          INSERT INTO poolup_accounts (user_id, account_number)
          VALUES (?, ?)
        `, [user_id, accountNumber]);
      }
      
      await db.run('COMMIT');
      
      logger.info(`Bank accounts linked successfully for user ${user_id}`);
      
      res.json({
        success: true,
        message: 'Bank accounts linked successfully',
        item_id,
        accounts: bankAccounts
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error exchanging public token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link bank account'
    });
  }
});

// Get user's linked accounts
router.get('/accounts', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    
    const accounts = await db.all(`
      SELECT 
        ba.*,
        pi.institution_name,
        pi.status as item_status
      FROM bank_accounts ba
      JOIN plaid_items pi ON ba.plaid_item_id = pi.id
      WHERE ba.user_id = ? AND ba.status = 'active'
      ORDER BY ba.is_primary DESC, ba.created_at ASC
    `, [user_id]);
    
    // Get PoolUp account
    const poolupAccount = await db.get(
      'SELECT * FROM poolup_accounts WHERE user_id = ? AND status = "active"',
      [user_id]
    );
    
    res.json({
      success: true,
      bank_accounts: accounts,
      poolup_account: poolupAccount
    });
    
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts'
    });
  }
});

// Set primary account
router.post('/accounts/:account_id/set-primary', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { account_id } = req.params;
    const user_id = req.user.user_id;
    
    await db.run('BEGIN TRANSACTION');
    
    // Remove primary flag from all accounts
    await db.run(
      'UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = ?',
      [user_id]
    );
    
    // Set new primary account
    const result = await db.run(
      'UPDATE bank_accounts SET is_primary = TRUE WHERE account_id = ? AND user_id = ?',
      [account_id, user_id]
    );
    
    if (result.changes === 0) {
      await db.run('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    await db.run('COMMIT');
    
    res.json({
      success: true,
      message: 'Primary account updated successfully'
    });
    
  } catch (error) {
    await db.run('ROLLBACK');
    logger.error('Error setting primary account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update primary account'
    });
  }
});

// Create processor token for Stripe
router.post('/accounts/:account_id/processor-token', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { account_id } = req.params;
    const user_id = req.user.user_id;
    
    // Get account and access token
    const accountData = await db.get(`
      SELECT ba.*, pi.access_token
      FROM bank_accounts ba
      JOIN plaid_items pi ON ba.plaid_item_id = pi.id
      WHERE ba.account_id = ? AND ba.user_id = ?
    `, [account_id, user_id]);
    
    if (!accountData) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    const processorTokenData = await createProcessorToken(
      accountData.access_token,
      account_id
    );
    
    res.json({
      success: true,
      processor_token: processorTokenData.processor_token
    });
    
  } catch (error) {
    logger.error('Error creating processor token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create processor token'
    });
  }
});

// Remove bank account
router.delete('/accounts/:account_id', async (req, res) => {
  const db = getDatabase();
  
  try {
    const { account_id } = req.params;
    const user_id = req.user.user_id;
    
    const result = await db.run(
      'UPDATE bank_accounts SET status = "inactive" WHERE account_id = ? AND user_id = ?',
      [account_id, user_id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Bank account removed successfully'
    });
    
  } catch (error) {
    logger.error('Error removing bank account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove bank account'
    });
  }
});

module.exports = router;
