import AsyncStorage from '@react-native-async-storage/async-storage';

const MONEY_API_BASE_URL = 'http://localhost:3001/api';

class MoneyApiService {
  constructor() {
    this.baseURL = MONEY_API_BASE_URL;
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication
  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      await AsyncStorage.setItem('authToken', response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.makeRequest('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Plaid Banking
  async createLinkToken(userId) {
    return this.makeRequest('/plaid/link/token/create', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async exchangePublicToken(publicToken, institutionId, institutionName) {
    return this.makeRequest('/plaid/link/token/exchange', {
      method: 'POST',
      body: JSON.stringify({
        public_token: publicToken,
        institution_id: institutionId,
        institution_name: institutionName,
      }),
    });
  }

  async getLinkedAccounts() {
    return this.makeRequest('/plaid/accounts');
  }

  async setPrimaryAccount(accountId) {
    return this.makeRequest(`/plaid/accounts/${accountId}/set-primary`, {
      method: 'POST',
    });
  }

  async removeAccount(accountId) {
    return this.makeRequest(`/plaid/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // ACH Transfers
  async createTransfer(transferData) {
    return this.makeRequest('/transfers/ach', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async getTransferHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/transfers/history?${queryString}`);
  }

  async getTransferStatus(transferId) {
    return this.makeRequest(`/transfers/${transferId}/status`);
  }

  async cancelTransfer(transferId) {
    return this.makeRequest(`/transfers/${transferId}/cancel`, {
      method: 'POST',
    });
  }

  async getTransferLimits() {
    return this.makeRequest('/transfers/limits');
  }

  // Savings Pools
  async createPool(poolData) {
    return this.makeRequest('/pools', {
      method: 'POST',
      body: JSON.stringify(poolData),
    });
  }

  async getMyPools() {
    return this.makeRequest('/pools/my-pools');
  }

  async getPoolDetails(poolId) {
    return this.makeRequest(`/pools/${poolId}`);
  }

  async joinPool(poolId, contributionData) {
    return this.makeRequest(`/pools/${poolId}/join`, {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
  }

  async contributeToPool(poolId, contributionData) {
    return this.makeRequest(`/pools/${poolId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
  }

  async leavePool(poolId) {
    return this.makeRequest(`/pools/${poolId}/leave`, {
      method: 'POST',
    });
  }

  async discoverPools(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/pools/discover/public?${queryString}`);
  }

  // Float Revenue & Interest
  async getUserInterest() {
    return this.makeRequest('/float/user-interest');
  }

  async getFloatRates() {
    return this.makeRequest('/float/rates');
  }

  async getRevenueAnalytics(period = '30') {
    return this.makeRequest(`/float/revenue/analytics?period=${period}`);
  }

  // Analytics
  async getUserFinancialAnalytics(period = '30') {
    return this.makeRequest(`/analytics/user/financial?period=${period}`);
  }

  async getPoolAnalytics(poolId) {
    return this.makeRequest(`/analytics/pools/${poolId}`);
  }

  // Utility methods
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}

export default new MoneyApiService();
