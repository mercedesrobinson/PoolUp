interface GoogleUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  accessToken: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  profileImage?: string;
  _mockPools?: any[];
  [key: string]: any;
}

interface Pool {
  id: string;
  name: string;
  goal_cents: number;
  destination?: string;
  trip_date?: string;
  [key: string]: any;
}

interface Contribution {
  id: string;
  pool_id: string;
  user_id: string;
  amount_cents: number;
  created_at: string;
  [key: string]: any;
}

// Use environment-based URL configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://poolup-api.onrender.com'  // Production backend service
  : 'http://localhost:3000';           // Development URL
const API_BASE = BASE_URL;

console.log('API Configuration:');
console.log('BASE_URL:', BASE_URL);
console.log('API_BASE:', API_BASE);

// Get current user ID from storage
const getCurrentUserId = (): string => {
  // For development, use a default user ID
  return '1756612920173';
};

// API service for PoolUp
export const api = {
  // Email/password auth
  emailSignUp: async (name: string, email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Signup failed');
    }
    return res.json();
  },
  emailLogin: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Login failed');
    }
    return res.json();
  },
  // Guest user creation
  guest: async (name: string): Promise<User> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      // console.log('API Error - using mock data:', error);
      // return { id: Date.now().toString(), name, email: null, profileImage: null };
      throw error;
    }
  },

  // Google OAuth user creation (dev: map to /api/users)
  createGoogleUser: async (googleUser: GoogleUser): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          profile_image_url: googleUser.photo,
        })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const json = await response.json();
      const user = json?.data || json;
      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        profileImage: user.profile_image_url,
        authProvider: 'google'
      } as any;
    } catch (error) {
      // console.log('Google API Error - using mock data:', error);
      // return { id: Date.now().toString(), name: googleUser.name, email: googleUser.email, profileImage: googleUser.photo, authProvider: 'google', bankAccounts: [], virtualCard: null };
      throw error;
    }
  },

  // Pools
  createPool: async (userId: string, name: string, goalCents: number, destination: string, tripDate: string, poolType: string, penaltyData: any) => {
    try {
      console.log('Creating pool with data:', { userId, name, goalCents, destination, tripDate, poolType, penaltyData });
      
      const response = await fetch(`${API_BASE}/pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getCurrentUserId()
        },
        body: JSON.stringify({
          name,
          goal_amount: goalCents,
          description: destination,
          created_by: Number(userId),
          trip_date: tripDate,
          pool_type: poolType,
          penalty_data: penaltyData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Pool created successfully:', result);
      return result;
    } catch (error) {
      console.error('Pool creation error:', error);
      throw error;
    }
  },


  getUserProfile: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      return response.json();
    } catch (error) {
      console.error('getUserProfile error:', error);
      // Return fallback data on error
      return {
        id: userId,
        name: 'User',
        xp: 0,
        total_points: 0,
        current_streak: 0,
        badge_count: 0,
        profile_image_url: null
      };
    }
  },


  googleLogin: async (googleProfile) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleProfile }),
      });
      return response.json();
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Chat messages
  messages: async (poolId: string) => {
    try {
      // Mock messages - empty for now
      console.log('Mock messages called for pool:', poolId);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Messages error:', error);
      return [];
    }
  },

  getWithdrawalInfo: async (poolId: string, userId: string) => {
    try {
      // Mock withdrawal info
      console.log('Mock getWithdrawalInfo called:', { poolId, userId });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { availableAmount: 0, penalty: 0 };
    } catch (error) {
      console.error('Withdrawal info error:', error);
      return { availableAmount: 0, penalty: 0 };
    }
  },

  processWithdrawal: async (poolId: string, userId: string, amountCents: number) => {
    try {
      // Mock withdrawal processing
      console.log('Mock processWithdrawal called:', { poolId, userId, amountCents });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { success: true, withdrawalId: Date.now().toString() };
    } catch (error) {
      console.error('Withdrawal processing error:', error);
      throw new Error('Withdrawal failed');
    }
  },

  // Photo upload
  updateUserPhoto: async (userId: string, profileImageUrl: string) => {
    try {
      // Mock photo upload
      console.log('Mock updateUserPhoto called:', { userId, profileImageUrl });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return { success: true, imageUrl: profileImageUrl };
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  },

  updatePrivacy: async (userId, isPublic, allowEncouragement) => {
    try {
      // Mock privacy update
      console.log('Mock updatePrivacy called:', { userId, isPublic, allowEncouragement });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return { success: true };
    } catch (error) {
      console.error('Privacy update error:', error);
      throw error;
    }
  },


  // Solo savings
  getPublicSoloPools: async (limit = 20) => {
    try {
      // Mock public solo pools - empty for now
      console.log('Mock getPublicSoloPools called with limit:', limit);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Public solo pools error:', error);
      return [];
    }
  },

  getStreakLeaderboard: async (limit = 20) => {
    try {
      // Mock streak leaderboard - empty for now
      console.log('Mock getStreakLeaderboard called with limit:', limit);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Streak leaderboard error:', error);
      return [];
    }
  },

  // Encouragement system
  sendEncouragement: async (fromUserId, toUserId, poolId, message, type = 'general') => {
    try {
      // Mock encouragement sending
      console.log('Mock sendEncouragement called:', { fromUserId, toUserId, poolId, message, type });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return { success: true, encouragementId: Date.now().toString() };
    } catch (error) {
      console.error('Send encouragement error:', error);
      throw error;
    }
  },

  getUserEncouragements: async (userId, limit = 50) => {
    try {
      // Mock user encouragements - empty for now
      console.log('Mock getUserEncouragements called:', { userId, limit });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Get user encouragements error:', error);
      return [];
    }
  },

  // Follow system
  followUser: async (userId, followerId) => {
    try {
      // Mock follow user
      console.log('Mock followUser called:', { userId, followerId });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return { success: true, following: true };
    } catch (error) {
      console.error('Follow user error:', error);
      throw error;
    }
  },

  unfollowUser: async (userId, followerId) => {
    try {
      // Mock unfollow user
      console.log('Mock unfollowUser called:', { userId, followerId });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return { success: true, following: false };
    } catch (error) {
      console.error('Unfollow user error:', error);
      throw error;
    }
  },

  getUserFollows: async (userId) => {
    try {
      // Mock user follows - empty for now
      console.log('Mock getUserFollows called for user:', userId);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { following: [], followers: [] };
    } catch (error) {
      console.error('Get user follows error:', error);
      return { following: [], followers: [] };
    }
  },

  getActivityFeed: async (userId, limit = 50) => {
    try {
      // Mock activity feed - empty for now
      console.log('Mock getActivityFeed called:', { userId, limit });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Get activity feed error:', error);
      return [];
    }
  },

  // Store created pools in memory for demo mode
  _mockPools: [] as any[],

  // New: list all pools from backend (no user filter)
  getPools: async () => {
    try {
      // Mock all pools - empty for now
      console.log('Mock getPools called');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Get pools error:', error);
      return [];
    }
  },

  getUserStreak: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/streak`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      return response.json();
    } catch (error) {
      console.error('Failed to load user streak:', error);
      return { current_streak: 0, longest_streak: 0, streak_start_date: null };
    }
  },

  listPools: async (userId: string): Promise<Pool[]> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/pools`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      const json = await response.json();
      return json?.data || json || [];
    } catch (error) {
      console.error('Failed to load pools:', error);
      return [];
    }
  },

  getPool: async (poolId: string) => {
    try {
      const response = await fetch(`${API_BASE}/pools/${poolId}`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      return response.json();
    } catch (error) {
      console.error('Get pool error:', error);
      throw error;
    }
  },

  contribute: async (poolId: string, { userId, amountCents, paymentMethod }: { userId: string; amountCents: number; paymentMethod: string }) => {
    try {
      const response = await fetch(`${API_BASE}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pool_id: Number(poolId), user_id: Number(userId) || 1, amount: Number(amountCents), description: paymentMethod || 'manual' })
      });
      return response.json();
    } catch (error) {
      console.error('Contribute error:', error);
      throw error;
    }
  },

  getMessages: async (poolId: string) => {
    try {
      const response = await fetch(`${API_BASE}/messages/${poolId}`);
      const json = await response.json();
      return json?.data || json;
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  },

  sendMessage: async (poolId: string, { userId, body }: { userId: string; body: string }) => {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pool_id: Number(poolId), user_id: Number(userId) || 1, content: body })
      });
      const json = await response.json();
      return json?.data || json;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  // Gamification APIs
  getUserBadges: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/badges`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

  getLeaderboard: async (poolId: string) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/leaderboard`);
    return res.json();
  },

  getChallenges: async (poolId: string) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/challenges`);
    return res.json();
  },

  getUnlockables: async (poolId: string) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/unlockables`);
    return res.json();
  },

  // Debit Card APIs
  createDebitCard: async (userId: string, cardHolderName: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardHolderName }),
    });
    return res.json();
  },

  getDebitCard: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`);
    return res.json();
  },

  processCardTransaction: async (cardId: string, amountCents: number, merchant: string, category: string) => {
    const res = await fetch(`${BASE_URL}/api/debit-card/${cardId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, merchant, category })
    });
    return res.json();
  },

  getCardTransactions: async (userId: string, limit = 50) => {
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

  async peerBoost(poolId, fromUserId, toUserId, amountCents) {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/peer-boost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId, amountCents })
    });
    return response.json();
  },


  // Notification API
  async storePushToken(userId, pushToken) {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken })
    });
    return response.json();
  },

  async updateNotificationPreferences(userId, preferences) {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/notification-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    return response.json();
  },

  async sendTestNotification(userId, pushToken) {
    const response = await fetch(`${BASE_URL}/api/notifications/send-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pushToken })
    });
    return response.json();
  },

  async calculateInterest(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/calculate-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Friends Feed
  getFriendsFeed: async (userId: string, filter = 'all') => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}/friends-feed?filter=${filter}`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      return res.json();
    } catch (error) {
      console.error('getFriendsFeed error:', error);
      // Return empty array instead of mock data
      return [];
    }
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
  getNotificationSettings: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return res.json();
  },

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
    // const recurringData = await api.saveRecurringPayment(getCurrentUserId(), { poolId });
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

  // Accountability partners (removed duplicate)

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
  },

  // Payday and Streaks APIs
  getPaydaySettings: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/payday-settings`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Payday settings API error:', error);
      return {
        type: 'weekly',
        weekly_day: 'friday',
        enable_streaks: true,
        reminder_days: 1
      };
    }
  },

  updatePaydaySettings: async (userId: string, settings: any) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/payday-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error('Update payday settings API error:', error);
      return { success: false, error: error.message };
    }
  },

  // Duplicate getUserStreak removed - using mock version above

  // Payment Methods APIs
  getUserPaymentMethods: async (userId: string) => {
    try {
      // Mock payment methods
      console.log('Mock getUserPaymentMethods called for user:', userId);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        venmo: { linked: false, username: null },
        cashapp: { linked: false, cashtag: null },
        paypal: { linked: false, email: null },
        bank: { linked: true, accountName: 'Primary Account' }
      };
    } catch (error) {
      console.error('Get payment methods error:', error);
      return {
        venmo: { linked: false, username: null },
        cashapp: { linked: false, cashtag: null },
        paypal: { linked: false, email: null },
        bank: { linked: true, accountName: 'Primary Account' }
      };
    }
  },

  linkPaymentMethod: async (userId: string, method: string, credentials: any) => {
    try {
      // Mock payment method linking
      console.log('Mock linkPaymentMethod called:', { userId, method, credentials });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      console.error('Link payment method error:', error);
      return { success: false, error: error.message };
    }
  },

  contributeToPool: async (poolId: string, userId: string, amountCents: number, paymentMethod: string, paymentToken: string | null = null) => {
    try {
      // Mock pool contribution
      console.log('Mock contributeToPool called:', { poolId, userId, amountCents, paymentMethod, paymentToken });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { success: true, contributionId: Date.now().toString() };
    } catch (error) {
      console.error('Contribute to pool error:', error);
      throw error;
    }
  },

  saveSoloGoalPrivacySettings: async (userId: string, poolId: string, settings: any) => {
    try {
      // Mock privacy settings save
      console.log('Mock saveSoloGoalPrivacySettings called:', { userId, poolId, settings });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { success: true };
    } catch (error) {
      console.error('Save solo goal privacy settings error:', error);
      throw error;
    }
  },

  // Peer Transfer APIs
  getPoolMembers: async (poolId: string) => {
    try {
      // Mock pool members - empty for now
      console.log('Mock getPoolMembers called for pool:', poolId);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Get pool members error:', error);
      return [];
    }
  },

  processPeerTransfer: async (poolId: string, fromUserId: string, toUserId: string, amountCents: number, message: string = '') => {
    try {
      // Mock peer transfer
      console.log('Mock processPeerTransfer called:', { poolId, fromUserId, toUserId, amountCents, message });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return { success: true, transferId: Date.now().toString() };
    } catch (error) {
      console.error('Peer transfer error:', error);
      throw error;
    }
  },

  getUserPeerTransfers: async (userId: string, limit: number = 50) => {
    try {
      // Mock peer transfers - empty for now
      console.log('Mock getUserPeerTransfers called:', { userId, limit });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [];
    } catch (error) {
      console.error('Get peer transfers error:', error);
      return [];
    }
  },

  // Penalty system APIs
  get: async (endpoint: string) => {
    try {
      // Mock GET requests
      console.log('Mock GET request to:', endpoint);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { data: [] };
    } catch (error) {
      console.error('GET request error:', error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      // Mock POST requests
      console.log('Mock POST request to:', endpoint, 'with data:', data);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return { success: true, data: { id: Date.now().toString() } };
    } catch (error) {
      console.error('POST request error:', error);
      throw error;
    }
  },

  // Payday and recurring payment settings
  savePaydaySettings: async (userId, settings) => {
    try {
      // Mock implementation to prevent errors
      console.log('Saving payday settings:', settings);
      return { success: true };
    } catch (error) {
      console.error('Save payday settings error:', error);
      throw error;
    }
  },

  saveRecurringPayment: async (userId, payment) => {
    try {
      // Mock implementation to prevent errors
      console.log('Saving recurring payment:', payment);
      return { success: true };
    } catch (error) {
      console.error('Save recurring payment error:', error);
      throw error;
    }
  },

  saveStreakSettings: async (userId, settings) => {
    try {
      // Mock implementation to prevent errors
      console.log('Saving streak settings:', settings);
      return { success: true };
    } catch (error) {
      console.error('Save streak settings error:', error);
      throw error;
    }
  },

  saveNotificationSettings: async (userId, settings) => {
    try {
      // Mock implementation to prevent errors
      console.log('Saving notification settings:', settings);
      return { success: true };
    } catch (error) {
      console.error('Save notification settings error:', error);
      throw error;
    }
  },

  // Add missing API methods
  getContributionSettings: async (userId: string, poolId: string) => {
    return {
      auto_contribute: false,
      amount_cents: 0,
      frequency: 'weekly'
    };
  },

  updateContributionSettings: async (userId: string, poolId: string, settings: any) => {
    return { success: true };
  },

  createRecurringContribution: async (userId: string, poolId: string, settings: any) => {
    return { success: true };
  },

  getGroupActivity: async (poolId: string, userId: string) => {
    return [];
  },

  inviteToPool: async (poolId: string, email: string) => {
    return { success: true };
  },

  changeMemberRole: async (poolId: string, memberId: string, role: string) => {
    return { success: true };
  },

  inviteToApp: async (email: string) => {
    return { success: true };
  },

  setDefaultPaymentMethod: async (userId: string, methodId: string) => {
    return { success: true };
  },

  removePaymentMethod: async (userId: string, methodId: string) => {
    return { success: true };
  },

  getAccountabilityPartners: async () => {
    return [];
  },

  uploadProfilePhoto: async (userId: string, imageData: string) => {
    return { success: true };
  },

  trackEvent: async (eventName: string, properties?: any) => {
    return { success: true };
  },

  getPoolProgress: async (poolId: string) => {
    return {
      goalName: 'Sample Goal',
      currentAmount: 0,
      targetAmount: 100000,
      progressPercentage: 0,
      daysRemaining: 30,
      streakDays: 0
    };
  },

  getRecurringPayments: async (userId: string) => {
    return [];
  },

  toggleRecurringPayment: async (paymentId: string, enabled: boolean) => {
    return { success: true };
  },

  deleteRecurringPayment: async (paymentId: string) => {
    return { success: true };
  },

  getPaymentMethods: async (userId: string) => {
    return [];
  },

  getSocialFeed: async (userId: string) => {
    return [];
  },

  toggleFeedItemLike: async (feedItemId: string, userId: string) => {
    return { success: true };
  },

  getSocialProofData: async () => {
    return {
      totalUsers: 10000,
      totalSaved: 5000000,
      goalsCompleted: 2500,
      averageSuccess: 85,
      averageStreak: 12,
      successStories: []
    };
  },

  getSoloGoalPrivacySettings: async (userId: string) => {
    return {
      shareProgress: true,
      shareMilestones: true,
      shareGoalCompletion: true
    };
  },

  updateSoloGoalPrivacySettings: async (userId: string, settings: any) => {
    return { success: true };
  }
};
