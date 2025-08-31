const API_BASE = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000/api';

// Get current user ID from storage
const getCurrentUserId = () => {
  // For development, use a default user ID
  return '1756612920173';
};

// API service for PoolUp
export const api = {
  // Guest user creation
  guest: async (name) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.log('API Error - using mock data:', error);
      return { id: Date.now(), name, email: null, profileImage: null };
    }
  },

  // Google OAuth user creation
  createGoogleUser: async (googleUser) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleUser.accessToken}`
        },
        body: JSON.stringify({
          google_id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          profile_image: googleUser.photo,
          access_token: googleUser.accessToken
        })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.log('Google API Error - using mock data:', error);
      return {
        id: Date.now(),
        name: googleUser.name,
        email: googleUser.email,
        profileImage: googleUser.photo,
        authProvider: 'google',
        bankAccounts: [],
        virtualCard: null
      };
    }
  },

  // Pools
  createPool: async (userId, name, goalCents, destination, tripDate, poolType) => {
    try {
      const response = await fetch(`${API_BASE}/pools`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': getCurrentUserId()
        },
        body: JSON.stringify({ userId, name, goalCents, destination, tripDate, poolType }),
      });
      if (!response.ok) throw new Error('Failed to create pool');
      return response.json();
    } catch (error) {
      console.log('Pool creation API error, using mock data:', error);
      // Mock successful pool creation for demo
      const newPool = {
        id: Date.now(),
        name,
        goal_cents: goalCents,
        saved_cents: 0,
        destination,
        tripDate,
        poolType,
        creator_id: userId,
        createdAt: new Date().toISOString(),
        success: true
      };
      // Store in mock pools array
      this._mockPools.push(newPool);
      return newPool;
    }
  },

  listPools: async (userId) => {
    const response = await fetch(`${API_BASE}/pools?userId=${userId}`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return response.json();
  },

  getUserProfile: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      if (!response.ok) throw new Error('Profile not found');
      return response.json();
    } catch (error) {
      console.log('getUserProfile API error, using mock data:', error);
      // Return mock data if backend not available
      return {
        id: userId,
        name: 'Mercedes',
        xp: 150,
        total_points: 250,
        current_streak: 3,
        badge_count: 2,
        avatar_type: 'default',
        avatar_data: null
      };
    }
  },

  getUserBadges: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/badges`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      if (!response.ok) throw new Error('Badges not found');
      return response.json();
    } catch (error) {
      return []; // Return empty array if backend not available
    }
  },

  getDebitCard: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/card`);
      if (!response.ok) throw new Error('Card not found');
      return response.json();
    } catch (error) {
      return null; // Return null if no card exists
    }
  },

  createDebitCard: async (userId, name) => {
    const response = await fetch(`${API_BASE}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name }),
    });
    return response.json();
  },

  googleLogin: async (googleProfile) => {
    const response = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleProfile }),
    });
    return response.json();
  },

  // Avatar system
  getAvatarOptions: async () => {
    const response = await fetch(`${BASE_URL}/api/avatar/options`);
    return response.json();
  },

  getAvatarPresets: async () => {
    const response = await fetch(`${BASE_URL}/api/avatar/presets`);
    return response.json();
  },

  generateAvatar: async () => {
    const response = await fetch(`${BASE_URL}/api/avatar/generate`, { method: 'POST' });
    return response.json();
  },

  updateAvatar: async (userId, avatarType, avatarData, profileImageUrl) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarType, avatarData, profileImageUrl }),
    });
    return response.json();
  },

  updatePrivacy: async (userId, isPublic, allowEncouragement) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic, allowEncouragement }),
    });
    return response.json();
  },


  // Solo savings
  getPublicSoloPools: async (limit = 20) => {
    const response = await fetch(`${BASE_URL}/api/pools/solo/public?limit=${limit}`);
    return response.json();
  },

  getStreakLeaderboard: async (limit = 20) => {
    const response = await fetch(`${BASE_URL}/api/leaderboard/streaks?limit=${limit}`);
    return response.json();
  },

  // Encouragement system
  sendEncouragement: async (fromUserId, toUserId, poolId, message, type = 'general') => {
    const response = await fetch(`${BASE_URL}/api/encouragement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId, poolId, message, type }),
    });
    return response.json();
  },

  getUserEncouragements: async (userId, limit = 50) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/encouragements?limit=${limit}`);
    return response.json();
  },

  // Follow system
  followUser: async (userId, followerId) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return response.json();
  },

  unfollowUser: async (userId, followerId) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return response.json();
  },

  getUserFollows: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follows`);
    return response.json();
  },

  getActivityFeed: async (userId, limit = 50) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/feed?limit=${limit}`);
    return response.json();
  },

  // Store created pools in memory for demo mode
  _mockPools: [],

  async listPools(userId) {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}/pools`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      if (!res.ok) throw new Error('Failed to fetch pools');
      return res.json();
    } catch (error) {
      console.log('listPools API error, using mock data:', error);
      // Return mock pools including any created ones
      return [
        {
          id: 1,
          name: "Tokyo Trip 2024",
          goal_cents: 300000,
          saved_cents: 75000,
          destination: "Tokyo, Japan",
          creator_id: userId
        },
        ...this._mockPools
      ];
    }
  },

  async getPool(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async contribute(poolId, { userId, amountCents, paymentMethod }) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amountCents, paymentMethod })
    });
    return res.json();
  },

  async getMessages(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`);
    return res.json();
  },

  async sendMessage(poolId, { userId, body }) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, body })
    });
    return res.json();
  },

  // Gamification APIs
  async getUserProfile(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/profile`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async getUserBadges(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/badges`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async getLeaderboard(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/leaderboard`);
    return res.json();
  },

  async getChallenges(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/challenges`);
    return res.json();
  },

  async getUnlockables(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/unlockables`);
    return res.json();
  },

  // Debit Card APIs
  async createDebitCard(userId, cardHolderName) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardHolderName })
    });
    return res.json();
  },

  async getDebitCard(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`);
    return res.json();
  },

  async processCardTransaction(cardId, amountCents, merchant, category) {
    const res = await fetch(`${BASE_URL}/api/debit-card/${cardId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, merchant, category })
    });
    return res.json();
  },

  async getCardTransactions(userId, limit = 50) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/card-transactions?limit=${limit}`);
    return res.json();
  },

  async getTravelPerks(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/travel-perks`);
    return res.json();
  },

  async getSpendingInsights(userId, days = 30) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/spending-insights?days=${days}`);
    return res.json();
  },

  async toggleCardStatus(cardId, userId) {
    const res = await fetch(`${BASE_URL}/api/debit-card/${cardId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async processForfeit(poolId, userId, reason, amount) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/forfeit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason, amount })
    });
    return res.json();
  },

  async peerBoost(poolId, boosterUserId, targetUserId, amountCents) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/peer-boost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boosterUserId, targetUserId, amountCents })
    });
    return res.json();
  },

  async calculateInterest(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/calculate-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Friends Feed
  async getFriendsFeed(userId, filter = 'all') {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/friends-feed?filter=${filter}`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  // Invite System
  async generateInviteCode(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/invite-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async inviteMemberToPool(poolId, email) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  // Group Management
  async getPoolMembers(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/members`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async removeMemberFromPool(poolId, memberId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async updateMemberRole(poolId, memberId, role) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/members/${memberId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  // Privacy Settings
  async getUserPrivacySettings(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async updatePrivacySetting(userId, setting, value) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() },
      body: JSON.stringify({ [setting]: value })
    });
    return res.json();
  },

  // Transaction History
  async getTransactionHistory(userId, filter = 'all', timeFilter = 'all') {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/transactions?filter=${filter}&time=${timeFilter}`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  // Savings Summary
  async getSavingsSummary(userId, timeframe = '6months') {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/savings-summary?timeframe=${timeframe}`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  // Penalty Settings
  async getPoolPenaltySettings(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/penalty-settings`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async updatePoolPenaltySettings(poolId, settings) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/penalty-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // Recurring Payments
  async getRecurringPaymentSettings(poolId, userId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/users/${userId}/recurring`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  async updateRecurringPaymentSettings(poolId, userId, settings) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/users/${userId}/recurring`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // Accountability partners
  async getAccountabilityPartners() {
    const response = await fetch(`${BASE_URL}/accountability-partners`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return response.json();
  },

  async inviteAccountabilityPartner(email) {
    const response = await fetch(`${BASE_URL}/accountability-partners/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getCurrentUserId()
      },
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  async removeAccountabilityPartner(partnerId) {
    const response = await fetch(`${BASE_URL}/accountability-partners/${partnerId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return response.json();
  },

  async updateNotificationSettings(settings) {
    const response = await fetch(`${BASE_URL}/notification-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getCurrentUserId()
      },
      body: JSON.stringify(settings)
    });
    return response.json();
  }
};
