import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import db from '../db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const router = express.Router();

// Webhook endpoint secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/stripe', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret!);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event with idempotency
  const eventId = event.id;
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent, eventId);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment, eventId);
        break;
        
      case 'account.updated':
        const account = event.data.object;
        await handleAccountUpdate(account, eventId);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({received: true});
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({error: 'Webhook processing failed'});
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, eventId: string): Promise<void> {
  // Check for idempotency
  const existing = db.prepare('SELECT id FROM webhook_events WHERE stripe_event_id = ?').get(eventId);
  if (existing) return;
  
  // Process successful payment
  const metadata = paymentIntent.metadata;
  if (metadata.pool_id && metadata.user_id) {
    db.prepare(`
      INSERT INTO contributions (id, pool_id, user_id, amount_cents, status, payment_method, transaction_id)
      VALUES (?, ?, ?, ?, 'completed', 'stripe', ?)
    `).run(
      `contrib_${Date.now()}`,
      metadata.pool_id,
      metadata.user_id,
      paymentIntent.amount,
      paymentIntent.id
    );
    
    // Record webhook processing
    db.prepare('INSERT INTO webhook_events (stripe_event_id, processed_at) VALUES (?, ?)').run(
      eventId, new Date().toISOString());
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, eventId: string): Promise<void> {
  // Handle failed payments - notify user, retry logic, etc.
  console.log('Payment failed:', paymentIntent.id);
}

async function handleAccountUpdate(account: Stripe.Account, eventId: string): Promise<void> {
  // Handle Stripe Connect account updates
  console.log('Account updated:', account.id);
}

export default router;
