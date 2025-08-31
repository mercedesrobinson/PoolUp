const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const logger = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  date_of_birth: Joi.date().required(),
  ssn_last_4: Joi.string().length(4).pattern(/^\d+$/).required(),
  address: Joi.object({
    line_1: Joi.string().required(),
    line_2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().length(2).required(),
    postal_code: Joi.string().required(),
    country: Joi.string().default('US')
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  user_id: Joi.string().optional()
});

// Register new user
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const {
      email, phone, first_name, last_name, date_of_birth,
      ssn_last_4, address
    } = req.body;
    
    // Check if user already exists
    const existingUser = await db.get(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }
    
    const user_id = uuidv4();
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Create user
      await db.run(`
        INSERT INTO users (
          user_id, email, phone, first_name, last_name, date_of_birth,
          ssn_last_4, address_line_1, address_line_2, city, state,
          postal_code, country, kyc_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user_id, email, phone, first_name, last_name, date_of_birth,
        ssn_last_4, address.line_1, address.line_2, address.city,
        address.state, address.postal_code, address.country, 'pending'
      ]);
      
      // Create PoolUp account
      const accountNumber = `PU${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await db.run(`
        INSERT INTO poolup_accounts (user_id, account_number)
        VALUES (?, ?)
      `, [user_id, accountNumber]);
      
      await db.run('COMMIT');
      
      // Generate JWT token
      const token = jwt.sign(
        { user_id, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      logger.info(`User registered: ${user_id} (${email})`);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          user_id,
          email,
          first_name,
          last_name,
          kyc_status: 'pending'
        },
        token,
        poolup_account: accountNumber
      });
      
    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  const db = getDatabase();
  
  try {
    const { email, user_id } = req.body;
    
    let user;
    if (user_id) {
      user = await db.get('SELECT * FROM users WHERE user_id = ?', [user_id]);
    } else {
      user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Get PoolUp account
    const poolupAccount = await db.get(
      'SELECT account_number, balance, interest_earned FROM poolup_accounts WHERE user_id = ?',
      [user.user_id]
    );
    
    logger.info(`User logged in: ${user.user_id} (${user.email})`);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        kyc_status: user.kyc_status
      },
      token,
      poolup_account
    });
    
  } catch (error) {
    logger.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    
    const user = await db.get(`
      SELECT 
        u.*,
        pa.account_number,
        pa.balance,
        pa.interest_earned,
        pa.last_interest_calculation
      FROM users u
      LEFT JOIN poolup_accounts pa ON u.user_id = pa.user_id
      WHERE u.user_id = ?
    `, [user_id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove sensitive data
    delete user.ssn_last_4;
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const db = getDatabase();
  
  try {
    const user_id = req.user.user_id;
    const { phone, address } = req.body;
    
    const updates = [];
    const params = [];
    
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    
    if (address) {
      if (address.line_1) {
        updates.push('address_line_1 = ?');
        params.push(address.line_1);
      }
      if (address.line_2) {
        updates.push('address_line_2 = ?');
        params.push(address.line_2);
      }
      if (address.city) {
        updates.push('city = ?');
        params.push(address.city);
      }
      if (address.state) {
        updates.push('state = ?');
        params.push(address.state);
      }
      if (address.postal_code) {
        updates.push('postal_code = ?');
        params.push(address.postal_code);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(user_id);
    
    await db.run(`
      UPDATE users SET ${updates.join(', ')}
      WHERE user_id = ?
    `, params);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Verify JWT token
router.get('/verify', (req, res) => {
  // This endpoint uses the auth middleware, so if we reach here, token is valid
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;
