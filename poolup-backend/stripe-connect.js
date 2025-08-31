const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeConnectService {
  constructor() {
    this.stripe = stripe;
  }

  // Create Stripe Connect Express account for KYC/KYB
  async createConnectAccount(userId, email, type = 'express') {
    try {
      const account = await this.stripe.accounts.create({
        type: type,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          poolup_user_id: userId.toString()
        }
      });

      return account;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  }

  // Create onboarding link for KYC/KYB
  async createOnboardingLink(accountId, refreshUrl, returnUrl) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  // Check account status and capabilities
  async getAccountStatus(accountId) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        capabilities: account.capabilities
      };
    } catch (error) {
      console.error('Error retrieving account status:', error);
      throw error;
    }
  }

  // Create customer for platform payments
  async createCustomer(userId, email, name) {
    try {
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          poolup_user_id: userId.toString()
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Hold funds in platform balance (custodial)
  async holdFunds(amount, currency = 'usd', customerId, description) {
    try {
      // Create payment intent to hold funds
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customerId,
        description: description,
        capture_method: 'manual', // Hold funds without capturing
        metadata: {
          type: 'custodial_hold',
          poolup_transaction: 'true'
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error holding funds:', error);
      throw error;
    }
  }

  // Capture held funds
  async captureFunds(paymentIntentId, amountToCapture = null) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(
        paymentIntentId,
        amountToCapture ? { amount_to_capture: amountToCapture } : {}
      );

      return paymentIntent;
    } catch (error) {
      console.error('Error capturing funds:', error);
      throw error;
    }
  }

  // Release held funds (refund)
  async releaseFunds(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount,
        reason: reason,
        metadata: {
          type: 'custodial_release'
        }
      });

      return refund;
    } catch (error) {
      console.error('Error releasing funds:', error);
      throw error;
    }
  }

  // Transfer funds between platform and connected accounts
  async transferFunds(amount, destinationAccountId, currency = 'usd', description) {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: amount,
        currency: currency,
        destination: destinationAccountId,
        description: description,
        metadata: {
          poolup_transfer: 'true'
        }
      });

      return transfer;
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  }

  // Get platform balance
  async getPlatformBalance() {
    try {
      const balance = await this.stripe.balance.retrieve();
      return balance;
    } catch (error) {
      console.error('Error retrieving platform balance:', error);
      throw error;
    }
  }

  // Create payment method for customer
  async createPaymentMethod(customerId, paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );

      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  // List customer payment methods
  async getCustomerPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type,
      });

      return paymentMethods;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw error;
    }
  }

  // Create Stripe Identity verification session for KYC
  async createIdentityVerification(customerId, returnUrl) {
    try {
      const verificationSession = await this.stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          customer_id: customerId,
          poolup_kyc: 'true'
        },
        return_url: returnUrl,
      });

      return verificationSession;
    } catch (error) {
      console.error('Error creating identity verification:', error);
      throw error;
    }
  }

  // Get verification session status
  async getVerificationStatus(sessionId) {
    try {
      const session = await this.stripe.identity.verificationSessions.retrieve(sessionId);
      return {
        id: session.id,
        status: session.status,
        verified: session.status === 'verified',
        requirements: session.last_error
      };
    } catch (error) {
      console.error('Error retrieving verification status:', error);
      throw error;
    }
  }
}

module.exports = new StripeConnectService();
