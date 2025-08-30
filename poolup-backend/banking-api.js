const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

// Initialize Plaid client
const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Gmail OAuth Authentication
router.post('/auth/google', async (req, res) => {
  try {
    const { access_token, google_id, name, email, profile_image } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: access_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // Check if user exists or create new one
    let user = await db.get('SELECT * FROM users WHERE google_id = ? OR email = ?', [google_id, email]);
    
    if (!user) {
      const result = await db.run(
        'INSERT INTO users (google_id, name, email, profile_image, auth_provider, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [google_id, name, email, profile_image, 'google', new Date().toISOString()]
      );
      
      user = {
        id: result.lastID,
        google_id,
        name,
        email,
        profile_image,
        auth_provider: 'google'
      };
      
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: { user_id: user.id.toString() }
      });
      
      await db.run('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customer.id, user.id]);
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image,
        authProvider: user.auth_provider
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ error: 'Invalid Google token' });
  }
});

// Create Plaid Link Token
router.post('/plaid/create-link-token', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const request = {
      user: { client_user_id: userId.toString() },
      client_name: 'PoolUp',
      products: ['transactions', 'auth', 'identity'],
      country_codes: ['US'],
      language: 'en',
      webhook: `${process.env.BASE_URL}/api/plaid/webhook`,
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings']
        }
      }
    };
    
    const response = await plaidClient.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Plaid link token error:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange Plaid public token for access token
router.post('/plaid/exchange-token', async (req, res) => {
  try {
    const { public_token } = req.body;
    const userId = req.user.id;
    
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });
    
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // Store access token securely
    await db.run(
      'INSERT OR REPLACE INTO plaid_items (user_id, access_token, item_id, created_at) VALUES (?, ?, ?, ?)',
      [userId, accessToken, itemId, new Date().toISOString()]
    );
    
    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    
    // Store account information
    for (const account of accountsResponse.data.accounts) {
      await db.run(
        'INSERT OR REPLACE INTO bank_accounts (user_id, plaid_account_id, account_name, account_type, account_subtype, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, account.account_id, account.name, account.type, account.subtype, new Date().toISOString()]
      );
    }
    
    res.json({ 
      success: true, 
      access_token: accessToken,
      accounts: accountsResponse.data.accounts 
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Get bank accounts
router.get('/plaid/accounts', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const plaidItem = await db.get('SELECT * FROM plaid_items WHERE user_id = ?', [userId]);
    if (!plaidItem) {
      return res.json({ accounts: [] });
    }
    
    const response = await plaidClient.accountsGet({
      access_token: plaidItem.access_token,
    });
    
    res.json({ accounts: response.data.accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

// Get account balance
router.get('/plaid/balance/:accountId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;
    
    const plaidItem = await db.get('SELECT * FROM plaid_items WHERE user_id = ?', [userId]);
    if (!plaidItem) {
      return res.status(404).json({ error: 'No bank account connected' });
    }
    
    const response = await plaidClient.accountsBalanceGet({
      access_token: plaidItem.access_token,
      options: { account_ids: [accountId] }
    });
    
    const account = response.data.accounts[0];
    res.json({ 
      balance: {
        available: account.balances.available,
        current: account.balances.current,
        currency: account.balances.iso_currency_code
      }
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Create virtual debit card
router.post('/stripe/create-card', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }
    
    // Create virtual card using Stripe Issuing
    const card = await stripe.issuing.cards.create({
      cardholder: user.stripe_customer_id,
      currency: 'usd',
      type: 'virtual',
      spending_controls: {
        spending_limits: [
          {
            amount: 100000, // $1000 daily limit
            interval: 'daily',
          },
        ],
      },
      metadata: { user_id: userId.toString() }
    });
    
    // Store card information
    await db.run(
      'INSERT INTO virtual_cards (user_id, stripe_card_id, last_four, exp_month, exp_year, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, card.id, card.last4, card.exp_month, card.exp_year, card.status, new Date().toISOString()]
    );
    
    res.json({
      card: {
        id: card.id,
        number: `**** **** **** ${card.last4}`,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: '***', // Never expose real CVC
        status: card.status
      }
    });
  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({ error: 'Failed to create virtual card' });
  }
});

// Process pool contribution
router.post('/payments/contribute', async (req, res) => {
  try {
    const { pool_id, amount, account_id, payment_method } = req.body;
    const userId = req.user.id;
    
    // Verify pool membership
    const membership = await db.get(
      'SELECT * FROM pool_memberships WHERE user_id = ? AND pool_id = ?',
      [userId, pool_id]
    );
    
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this pool' });
    }
    
    // Create ACH transfer using Plaid
    const plaidItem = await db.get('SELECT * FROM plaid_items WHERE user_id = ?', [userId]);
    
    if (payment_method === 'bank_transfer' && plaidItem) {
      // In production, you would use Plaid's payment initiation or ACH
      // For now, we'll simulate the transfer
      
      // Record the contribution
      await db.run(
        'INSERT INTO contributions (user_id, pool_id, amount_cents, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, pool_id, amount * 100, payment_method, 'completed', new Date().toISOString()]
      );
      
      // Update pool total
      await db.run(
        'UPDATE pools SET current_amount_cents = current_amount_cents + ? WHERE id = ?',
        [amount * 100, pool_id]
      );
      
      res.json({ 
        success: true, 
        contribution_id: this.lastID,
        message: 'Contribution processed successfully'
      });
    } else {
      res.status(400).json({ error: 'Invalid payment method or no bank account connected' });
    }
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ error: 'Failed to process contribution' });
  }
});

// Get transaction history
router.post('/plaid/transactions', async (req, res) => {
  try {
    const { account_id, start_date, end_date } = req.body;
    const userId = req.user.id;
    
    const plaidItem = await db.get('SELECT * FROM plaid_items WHERE user_id = ?', [userId]);
    if (!plaidItem) {
      return res.json({ transactions: [] });
    }
    
    const response = await plaidClient.transactionsGet({
      access_token: plaidItem.access_token,
      start_date: start_date,
      end_date: end_date,
      options: {
        account_ids: account_id ? [account_id] : undefined,
        count: 100
      }
    });
    
    res.json({ transactions: response.data.transactions });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

// Set up automatic contributions
router.post('/payments/auto-contribute', async (req, res) => {
  try {
    const { pool_id, amount, frequency, account_id } = req.body;
    const userId = req.user.id;
    
    // Store auto-contribution settings
    await db.run(
      'INSERT OR REPLACE INTO auto_contributions (user_id, pool_id, amount_cents, frequency, account_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, pool_id, amount * 100, frequency, account_id, 1, new Date().toISOString()]
    );
    
    res.json({ 
      success: true, 
      message: `Auto-contribution set up for ${frequency} payments of $${amount}` 
    });
  } catch (error) {
    console.error('Auto contribution setup error:', error);
    res.status(500).json({ error: 'Failed to set up automatic contributions' });
  }
});

// Toggle card status (freeze/unfreeze)
router.post('/stripe/toggle-card', async (req, res) => {
  try {
    const { card_id, freeze } = req.body;
    const userId = req.user.id;
    
    // Verify card ownership
    const card = await db.get('SELECT * FROM virtual_cards WHERE stripe_card_id = ? AND user_id = ?', [card_id, userId]);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Update card status in Stripe
    const updatedCard = await stripe.issuing.cards.update(card_id, {
      status: freeze ? 'inactive' : 'active'
    });
    
    // Update local database
    await db.run('UPDATE virtual_cards SET status = ? WHERE stripe_card_id = ?', [updatedCard.status, card_id]);
    
    res.json({ status: updatedCard.status });
  } catch (error) {
    console.error('Card toggle error:', error);
    res.status(500).json({ error: 'Failed to update card status' });
  }
});

// Get spending analytics
router.post('/analytics/spending', async (req, res) => {
  try {
    const { account_id, period } = req.body;
    const userId = req.user.id;
    
    const plaidItem = await db.get('SELECT * FROM plaid_items WHERE user_id = ?', [userId]);
    if (!plaidItem) {
      return res.json({ 
        total_spent: 0, 
        categories: [], 
        trends: [], 
        savings_rate: 0 
      });
    }
    
    // Calculate date range based on period
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    const response = await plaidClient.transactionsGet({
      access_token: plaidItem.access_token,
      start_date: startDate,
      end_date: endDate,
      options: { account_ids: account_id ? [account_id] : undefined }
    });
    
    const transactions = response.data.transactions;
    const totalSpent = transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    
    // Categorize spending
    const categories = {};
    transactions.forEach(txn => {
      const category = txn.category[0] || 'Other';
      categories[category] = (categories[category] || 0) + Math.abs(txn.amount);
    });
    
    // Calculate savings rate (simplified)
    const income = 5000; // This would come from income transactions or user input
    const savingsRate = ((income - totalSpent) / income) * 100;
    
    res.json({
      total_spent: totalSpent,
      categories: Object.entries(categories).map(([name, amount]) => ({ name, amount })),
      trends: [], // Would calculate spending trends over time
      savings_rate: Math.max(0, savingsRate)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get spending analytics' });
  }
});

module.exports = router;
