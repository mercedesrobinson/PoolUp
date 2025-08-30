import * as Keychain from 'react-native-keychain';
import { getAuthToken, getCurrentUser } from './auth';

// Banking service for PoolUp - integrates with Plaid, Stripe, and other financial APIs
const API_BASE_URL = 'http://localhost:3000/api';

class BankingService {
  constructor() {
    this.plaidToken = null;
    this.stripeCustomerId = null;
    this.baseURL = API_BASE_URL;
  }

  async getAuthHeaders() {
    const user = await getCurrentUser();
    return {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || '1' // Fallback for development
    };
  }

  // Initialize Plaid Link for bank account connection
  async initializePlaidLink() {
    try {
      const response = await fetch(`${this.baseURL}/plaid/create-link-token`, {
        method: 'POST',
        headers: await this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to create link token');
      }
      
      const data = await response.json();
      return data.link_token;
    } catch (error) {
      console.error('Plaid initialization error:', error);
      throw new Error('Failed to initialize bank connection');
    }
  }

  // Connect bank account via Plaid
  async connectBankAccount(publicToken) {
    try {
      const response = await fetch(`${this.baseURL}/plaid/exchange-token`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ public_token: publicToken })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const data = await response.json();
      
      // Store access token securely
      await Keychain.setInternetCredentials(
        'poolup_plaid_token',
        'plaid_access',
        data.access_token
      );

      this.plaidToken = data.access_token;
      return data;
    } catch (error) {
      console.error('Bank connection error:', error);
      throw new Error('Failed to connect bank account');
    }
  }

  // Get bank accounts
  async getBankAccounts() {
    try {
      const response = await fetch(`${this.baseURL}/plaid/accounts`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get accounts');
      }

      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      console.error('Get accounts error:', error);
      return [];
    }
  }

  // Get account balance
  async getAccountBalance(accountId) {
    try {
      const response = await fetch(`${this.baseURL}/plaid/balance/${accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Balance fetch error:', error);
      return null;
    }
  }

  // Create virtual debit card via Stripe
  async createVirtualDebitCard(userId) {
    try {
      const response = await fetch(`${this.baseURL}/stripe/create-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      return {
        cardNumber: data.card.number,
        expiryMonth: data.card.exp_month,
        expiryYear: data.card.exp_year,
        cvv: data.card.cvc,
        cardId: data.card.id,
        status: data.card.status
      };
    } catch (error) {
      console.error('Card creation error:', error);
      throw new Error('Failed to create virtual debit card');
    }
  }

  // Process pool contribution
  async processContribution(poolId, amount, accountId) {
    try {
      const response = await fetch(`${this.baseURL}/payments/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          pool_id: poolId,
          amount: amount,
          account_id: accountId,
          payment_method: 'bank_transfer'
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Contribution error:', error);
      throw new Error('Failed to process contribution');
    }
  }

  // Withdraw from pool
  async withdrawFromPool(poolId, amount, destinationAccountId) {
    try {
      const response = await fetch(`${this.baseURL}/payments/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          pool_id: poolId,
          amount: amount,
          destination_account_id: destinationAccountId
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Withdrawal error:', error);
      throw new Error('Failed to process withdrawal');
    }
  }

  // Get transaction history
  async getTransactionHistory(accountId, startDate, endDate) {
    try {
      const response = await fetch(`${this.baseURL}/plaid/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          account_id: accountId,
          start_date: startDate,
          end_date: endDate
        })
      });

      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Transaction history error:', error);
      return [];
    }
  }

  // Set up automatic contributions (ACH recurring)
  async setupAutoContribution(poolId, amount, frequency, accountId) {
    try {
      const response = await fetch(`${this.baseURL}/payments/auto-contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          pool_id: poolId,
          amount: amount,
          frequency: frequency, // 'weekly', 'biweekly', 'monthly'
          account_id: accountId
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auto contribution setup error:', error);
      throw new Error('Failed to set up automatic contributions');
    }
  }

  // Freeze/unfreeze virtual debit card
  async toggleCardStatus(cardId, freeze = true) {
    try {
      const response = await fetch(`${this.baseURL}/stripe/toggle-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          card_id: cardId,
          freeze: freeze
        })
      });

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Card toggle error:', error);
      throw new Error('Failed to update card status');
    }
  }

  // Get spending analytics
  async getSpendingAnalytics(accountId, period = '30d') {
    try {
      const response = await fetch(`${this.baseURL}/analytics/spending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          account_id: accountId,
          period: period
        })
      });

      const data = await response.json();
      return {
        totalSpent: data.total_spent,
        categories: data.categories,
        trends: data.trends,
        savingsRate: data.savings_rate
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }

  // Helper method to get auth token
  async getAuthToken() {
    try {
      const credentials = await Keychain.getInternetCredentials('poolup_user');
      if (credentials) {
        const user = JSON.parse(credentials.password);
        return user.accessToken;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Verify bank account with micro-deposits
  async verifyBankAccount(accountId, amounts) {
    try {
      const response = await fetch(`${this.baseURL}/plaid/verify-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          account_id: accountId,
          amounts: amounts
        })
      });

      const data = await response.json();
      return data.verified;
    } catch (error) {
      console.error('Account verification error:', error);
      return false;
    }
  }
}

export default new BankingService();
