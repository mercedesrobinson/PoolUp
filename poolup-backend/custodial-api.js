const express = require('express');
const router = express.Router();
const stripeConnect = require('./stripe-connect');

// Custodial Balance Management Routes

// Create Stripe Connect account for user (KYC/KYB)
router.post('/users/:userId/connect-account', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, type = 'express' } = req.body;

    const account = await stripeConnect.createConnectAccount(userId, email, type);
    
    // Store account ID in database
    await global.db.run(
      'UPDATE users SET stripe_connect_account_id = ? WHERE id = ?',
      [account.id, userId]
    );

    res.json({
      success: true,
      account_id: account.id,
      onboarding_required: !account.details_submitted
    });
  } catch (error) {
    console.error('Connect account creation error:', error);
    res.status(500).json({ error: 'Failed to create Connect account' });
  }
});

// Create onboarding link for KYC/KYB
router.post('/users/:userId/onboarding-link', async (req, res) => {
  try {
    const { userId } = req.params;
    const { refresh_url, return_url } = req.body;

    // Get user's Connect account ID
    const user = await global.db.get('SELECT stripe_connect_account_id FROM users WHERE id = ?', [userId]);
    if (!user?.stripe_connect_account_id) {
      return res.status(400).json({ error: 'No Connect account found for user' });
    }

    const link = await stripeConnect.createOnboardingLink(
      user.stripe_connect_account_id,
      refresh_url,
      return_url
    );

    res.json({
      success: true,
      onboarding_url: link.url,
      expires_at: link.expires_at
    });
  } catch (error) {
    console.error('Onboarding link creation error:', error);
    res.status(500).json({ error: 'Failed to create onboarding link' });
  }
});

// Get account verification status
router.get('/users/:userId/verification-status', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await global.db.get('SELECT stripe_connect_account_id FROM users WHERE id = ?', [userId]);
    if (!user?.stripe_connect_account_id) {
      return res.status(400).json({ error: 'No Connect account found for user' });
    }

    const status = await stripeConnect.getAccountStatus(user.stripe_connect_account_id);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Hold funds in custodial balance
router.post('/users/:userId/hold-funds', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, currency = 'usd', description, payment_method_id } = req.body;

    // Get or create Stripe customer
    let user = await global.db.get('SELECT stripe_customer_id, email, name FROM users WHERE id = ?', [userId]);
    
    if (!user.stripe_customer_id) {
      const customer = await stripeConnect.createCustomer(userId, user.email, user.name);
      await global.db.run(
        'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
        [customer.id, userId]
      );
      user.stripe_customer_id = customer.id;
    }

    // Attach payment method if provided
    if (payment_method_id) {
      await stripeConnect.createPaymentMethod(user.stripe_customer_id, payment_method_id);
    }

    const paymentIntent = await stripeConnect.holdFunds(
      amount,
      currency,
      user.stripe_customer_id,
      description
    );

    // Store transaction in database
    await global.db.run(
      `INSERT INTO custodial_transactions 
       (user_id, stripe_payment_intent_id, amount_cents, currency, status, type, description, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, paymentIntent.id, amount, currency, 'held', 'hold', description, new Date().toISOString()]
    );

    res.json({
      success: true,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Hold funds error:', error);
    res.status(500).json({ error: 'Failed to hold funds' });
  }
});

// Capture held funds
router.post('/transactions/:paymentIntentId/capture', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { amount_to_capture } = req.body;

    const paymentIntent = await stripeConnect.captureFunds(paymentIntentId, amount_to_capture);

    // Update transaction status
    await global.db.run(
      'UPDATE custodial_transactions SET status = ?, captured_at = ? WHERE stripe_payment_intent_id = ?',
      ['captured', new Date().toISOString(), paymentIntentId]
    );

    res.json({
      success: true,
      payment_intent_id: paymentIntent.id,
      status: paymentIntent.status,
      amount_captured: paymentIntent.amount_received
    });
  } catch (error) {
    console.error('Capture funds error:', error);
    res.status(500).json({ error: 'Failed to capture funds' });
  }
});

// Release held funds (refund)
router.post('/transactions/:paymentIntentId/release', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { amount, reason = 'requested_by_customer' } = req.body;

    const refund = await stripeConnect.releaseFunds(paymentIntentId, amount, reason);

    // Update transaction status
    await global.db.run(
      'UPDATE custodial_transactions SET status = ?, refunded_at = ? WHERE stripe_payment_intent_id = ?',
      ['refunded', new Date().toISOString(), paymentIntentId]
    );

    res.json({
      success: true,
      refund_id: refund.id,
      status: refund.status,
      amount_refunded: refund.amount
    });
  } catch (error) {
    console.error('Release funds error:', error);
    res.status(500).json({ error: 'Failed to release funds' });
  }
});

// Transfer funds between accounts
router.post('/users/:userId/transfer', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, destination_user_id, description } = req.body;

    // Get destination user's Connect account
    const destUser = await global.db.get(
      'SELECT stripe_connect_account_id FROM users WHERE id = ?',
      [destination_user_id]
    );

    if (!destUser?.stripe_connect_account_id) {
      return res.status(400).json({ error: 'Destination user has no Connect account' });
    }

    const transfer = await stripeConnect.transferFunds(
      amount,
      destUser.stripe_connect_account_id,
      'usd',
      description
    );

    // Record transfer in database
    await global.db.run(
      `INSERT INTO transfers 
       (from_user_id, to_user_id, amount_cents, stripe_transfer_id, description, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, destination_user_id, amount, transfer.id, description, 'completed', new Date().toISOString()]
    );

    res.json({
      success: true,
      transfer_id: transfer.id,
      amount: transfer.amount,
      status: 'completed'
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer funds' });
  }
});

// Get user's custodial balance
router.get('/users/:userId/balance', async (req, res) => {
  try {
    const { userId } = req.params;

    // Calculate balance from transactions
    const result = await global.db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'captured' THEN amount_cents ELSE 0 END), 0) as total_captured,
        COALESCE(SUM(CASE WHEN status = 'held' THEN amount_cents ELSE 0 END), 0) as total_held,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount_cents ELSE 0 END), 0) as total_refunded
      FROM custodial_transactions 
      WHERE user_id = ?
    `, [userId]);

    // Calculate outgoing transfers
    const outgoing = await global.db.get(`
      SELECT COALESCE(SUM(amount_cents), 0) as total_outgoing
      FROM transfers 
      WHERE from_user_id = ? AND status = 'completed'
    `, [userId]);

    // Calculate incoming transfers
    const incoming = await global.db.get(`
      SELECT COALESCE(SUM(amount_cents), 0) as total_incoming
      FROM transfers 
      WHERE to_user_id = ? AND status = 'completed'
    `, [userId]);

    const available_balance = result.total_captured + incoming.total_incoming - outgoing.total_outgoing - result.total_refunded;
    const held_balance = result.total_held;

    res.json({
      success: true,
      available_balance_cents: available_balance,
      held_balance_cents: held_balance,
      total_balance_cents: available_balance + held_balance
    });
  } catch (error) {
    console.error('Balance calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
});

// Get transaction history
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const transactions = await global.db.all(`
      SELECT 
        id,
        stripe_payment_intent_id,
        amount_cents,
        currency,
        status,
        type,
        description,
        created_at,
        captured_at,
        refunded_at
      FROM custodial_transactions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

module.exports = router;
