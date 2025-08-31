const API_BASE = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000/api';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, goalCents, destination, tripDate, poolType }),
      });
      if (!response.ok) throw new Error('Failed to create pool');
      return response.json();
    } catch (error) {
      // Mock successful pool creation for demo
      return {
        id: Date.now(),
        name,
        goalCents,
        destination,
        tripDate,
        poolType,
        userId,
        createdAt: new Date().toISOString()
      };
    }
  },

  listPools: async (userId) => {
    const response = await fetch(`${API_BASE}/pools?userId=${userId}`);
    return response.json();
  },

  getUserProfile: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!response.ok) throw new Error('Profile not found');
      return response.json();
    } catch (error) {
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
      const response = await fetch(`${API_BASE}/users/${userId}/badges`);
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

  updateProfilePhoto: async (userId, photoUri) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/profile-photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: photoUri }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    } catch (error) {
      console.log('Profile photo API Error - using mock data:', error);
      return { success: true, profile_image: photoUri };
    }
  },

  updateProfilePhoto: async (userId, photoUri) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/profile-photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: photoUri }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    } catch (error) {
      console.log('Profile photo API Error - using mock data:', error);
      return { success: true, profile_image: photoUri };
    }
  },

  updatePrivacy: async (userId, isPublic, allowEncouragement) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic, allowEncouragement }),
    });
    return response.json();
  },

  async createPool(ownerId, name, goalCents, destination, tripDate, poolType = 'group') {
    const res = await fetch(`${BASE_URL}/api/pools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, name, goalCents, destination, tripDate, poolType })
    });
    return res.json();
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

  async listPools(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/pools`);
    return res.json();
  },

  async getPool(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}`);
    return res.json();
  },

  async contribute(poolId, { userId, amountCents, paymentMethod }) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amountCents, paymentMethod })
    });
    return res.json();
  },

  async getMessages(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/messages`);
    return res.json();
  },

  async sendMessage(poolId, { userId, body }) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, body })
    });
    return res.json();
  },

  // Gamification APIs
  async getUserProfile(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/profile`);
    return res.json();
  },

  async getUserBadges(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/badges`);
    return res.json();
  },

  async getLeaderboard(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/leaderboard`);
    return res.json();
  },

  async getChallenges(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/challenges`);
    return res.json();
  },

  async getUnlockables(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/unlockables`);
    return res.json();
  },

  // Debit Card APIs
  async createDebitCard(userId, cardHolderName) {
    const res = await fetch(`${SERVER}/api/users/${userId}/debit-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardHolderName })
    });
    return res.json();
  },

  async getDebitCard(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/debit-card`);
    return res.json();
  },

  async processCardTransaction(cardId, amountCents, merchant, category) {
    const res = await fetch(`${SERVER}/api/debit-card/${cardId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, merchant, category })
    });
    return res.json();
  },

  async getCardTransactions(userId, limit = 50) {
    const res = await fetch(`${SERVER}/api/users/${userId}/card-transactions?limit=${limit}`);
    return res.json();
  },

  async getTravelPerks(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/travel-perks`);
    return res.json();
  },

  async getSpendingInsights(userId, days = 30) {
    const res = await fetch(`${SERVER}/api/users/${userId}/spending-insights?days=${days}`);
    return res.json();
  },

  async toggleCardStatus(cardId, userId) {
    const res = await fetch(`${SERVER}/api/debit-card/${cardId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async processForfeit(poolId, userId, reason, amount) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/forfeit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason, amount })
    });
    return res.json();
  },

  async peerBoost(poolId, boosterUserId, targetUserId, amountCents) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/peer-boost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boosterUserId, targetUserId, amountCents })
    });
    return res.json();
  },

  async calculateInterest(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/calculate-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }
};
