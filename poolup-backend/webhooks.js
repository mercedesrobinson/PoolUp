const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe webhook endpoint
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      case 'transfer.updated':
        await handleTransferUpdated(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;
      
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'identity.verification_session.verified':
        await handleIdentityVerified(event.data.object);
        break;
      
      case 'identity.verification_session.requires_input':
        await handleIdentityRequiresInput(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  try {
    await global.db.run(
      'UPDATE custodial_transactions SET status = ?, captured_at = ? WHERE stripe_payment_intent_id = ?',
      ['captured', new Date().toISOString(), paymentIntent.id]
    );
    
    console.log('Payment succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  try {
    await global.db.run(
      'UPDATE custodial_transactions SET status = ?, failed_at = ? WHERE stripe_payment_intent_id = ?',
      ['failed', new Date().toISOString(), paymentIntent.id]
    );
    
    console.log('Payment failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle transfer creation
async function handleTransferCreated(transfer) {
  try {
    await global.db.run(
      'UPDATE transfers SET status = ? WHERE stripe_transfer_id = ?',
      ['in_transit', transfer.id]
    );
    
    console.log('Transfer created:', transfer.id);
  } catch (error) {
    console.error('Error handling transfer creation:', error);
  }
}

// Handle transfer updates
async function handleTransferUpdated(transfer) {
  try {
    await global.db.run(
      'UPDATE transfers SET status = ?, updated_at = ? WHERE stripe_transfer_id = ?',
      [transfer.status, new Date().toISOString(), transfer.id]
    );
    
    console.log('Transfer updated:', transfer.id, transfer.status);
  } catch (error) {
    console.error('Error handling transfer update:', error);
  }
}

// Handle dispute creation
async function handleDisputeCreated(dispute) {
  try {
    // Insert dispute record
    await global.db.run(
      `INSERT INTO disputes 
       (stripe_dispute_id, charge_id, amount_cents, reason, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dispute.id, dispute.charge, dispute.amount, dispute.reason, dispute.status, new Date().toISOString()]
    );
    
    console.log('Dispute created:', dispute.id);
    
    // TODO: Notify relevant users about the dispute
  } catch (error) {
    console.error('Error handling dispute creation:', error);
  }
}

// Handle Connect account updates
async function handleAccountUpdated(account) {
  try {
    const userId = account.metadata?.poolup_user_id;
    if (userId) {
      await global.db.run(
        'UPDATE users SET stripe_account_verified = ?, updated_at = ? WHERE id = ?',
        [account.charges_enabled && account.payouts_enabled, new Date().toISOString(), userId]
      );
      
      console.log('Account updated for user:', userId);
    }
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

// Handle identity verification completion
async function handleIdentityVerified(session) {
  try {
    const customerId = session.metadata?.customer_id;
    if (customerId) {
      await global.db.run(
        'UPDATE users SET identity_verified = ?, identity_verified_at = ? WHERE stripe_customer_id = ?',
        [true, new Date().toISOString(), customerId]
      );
      
      console.log('Identity verified for customer:', customerId);
    }
  } catch (error) {
    console.error('Error handling identity verification:', error);
  }
}

// Handle identity verification requiring input
async function handleIdentityRequiresInput(session) {
  try {
    const customerId = session.metadata?.customer_id;
    if (customerId) {
      console.log('Identity verification requires input for customer:', customerId);
      // TODO: Notify user that additional information is needed
    }
  } catch (error) {
    console.error('Error handling identity verification input:', error);
  }
}

module.exports = router;
