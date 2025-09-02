import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import db from './db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
  };
}

// Create Stripe Connect account for user
router.post('/create-account', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user already has a Stripe account
    const existingAccount = db.prepare('SELECT stripe_account_id FROM users WHERE id = ?').get(userId) as any;
    if (existingAccount?.stripe_account_id) {
      return res.json({ account_id: existingAccount.stripe_account_id });
    }

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: req.user?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account ID to database
    db.prepare('UPDATE users SET stripe_account_id = ? WHERE id = ?').run(account.id, userId);

    res.json({ account_id: account.id });
  } catch (error: any) {
    console.error('Stripe account creation error:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});

// Create account link for onboarding
router.post('/account-link', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { account_id } = req.body;
    
    const accountLink = await stripe.accountLinks.create({
      account: account_id,
      refresh_url: `${process.env.FRONTEND_URL}/reauth`,
      return_url: `${process.env.FRONTEND_URL}/return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Account link creation error:', error);
    res.status(500).json({ error: 'Failed to create account link' });
  }
});

// Check account status
router.get('/account-status/:account_id', async (req: Request, res: Response) => {
  try {
    const { account_id } = req.params;
    
    const account = await stripe.accounts.retrieve(account_id as string);
    
    res.json({
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (error: any) {
    console.error('Account status check error:', error);
    res.status(500).json({ error: 'Failed to check account status' });
  }
});

// Create payment intent for pool contribution
router.post('/create-payment-intent', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pool_id, amount_cents } = req.body;
    const userId = req.user?.id;

    if (!userId || !pool_id || !amount_cents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get pool information
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(pool_id) as any;
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: 'usd',
      metadata: {
        pool_id,
        user_id: userId,
      },
      application_fee_amount: Math.floor(amount_cents * 0.029), // 2.9% platform fee
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Transfer funds to pool members
router.post('/transfer-to-members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pool_id } = req.body;
    
    // Get pool and calculate member shares
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(pool_id) as any;
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    const members = db.prepare(`
      SELECT u.id, u.stripe_account_id, SUM(c.amount_cents) as total_contributed
      FROM users u
      JOIN memberships m ON u.id = m.user_id
      LEFT JOIN contributions c ON u.id = c.user_id AND c.pool_id = ?
      WHERE m.pool_id = ? AND u.stripe_account_id IS NOT NULL
      GROUP BY u.id
    `).all(pool_id, pool_id) as any[];

    const totalPoolAmount = members.reduce((sum, member) => sum + (member.total_contributed || 0), 0);
    
    // Create transfers for each member
    const transfers = await Promise.all(
      members.map(async (member) => {
        const memberShare = Math.floor((member.total_contributed / totalPoolAmount) * pool.current_amount_cents);
        
        if (memberShare > 0) {
          return await stripe.transfers.create({
            amount: memberShare,
            currency: 'usd',
            destination: member.stripe_account_id,
            metadata: {
              pool_id,
              user_id: member.id,
            },
          });
        }
        return null;
      })
    );

    res.json({ transfers: transfers.filter(Boolean) });
  } catch (error: any) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to process transfers' });
  }
});

export default router;
