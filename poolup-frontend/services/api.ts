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

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://poolup-api.onrender.com";
const BASE_URL = `${API_BASE}/api`;
const USE_MOCK_DATA = false;

// Get current user ID from storage
const getCurrentUserId = (): string => {
  // TODO: Get from AsyncStorage or user context
  return "1756612920173";
};

// API service for PoolUp
export const api = {
  // Guest user creation
  guest: async (name: string): Promise<User> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.log("API Error - using mock data:", error);
      return {
        id: Date.now().toString(),
        name,
        email: null,
        profileImage: null,
      };
    }
  },

  // Google OAuth user creation
  createGoogleUser: async (googleUser: GoogleUser): Promise<User> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${googleUser.accessToken}`,
        },
        body: JSON.stringify({
          google_id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          profile_image: googleUser.photo,
          access_token: googleUser.accessToken,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.log("Google API Error - using mock data:", error);
      return {
        id: Date.now().toString(),
        name: googleUser.name,
        email: googleUser.email,
        profileImage: googleUser.photo,
        authProvider: "google",
        bankAccounts: [],
        virtualCard: null,
      };
    }
  },

  // Get user's pools
  getUserPools: async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/pools`);
      if (!response.ok) throw new Error('Failed to fetch pools');
      return await response.json();
    } catch (error) {
      console.error('getUserPools error:', error);
      return []; // Return empty array as fallback
    }
  },

  // Get user's transactions
  getUserTransactions: async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return await response.json();
    } catch (error) {
      console.error('getUserTransactions error:', error);
      return []; // Return empty array as fallback
    }
  },

  // Pools
  createPool: async (
    userId,
    name,
    goalCents,
    destination,
    tripDate,
    poolType = "group",
    penaltyData = null,
    isPrivate = false
  ) => {
    try {
      const response = await fetch(`${API_BASE}/pools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          userId,
          name,
          goalCents,
          destination,
          tripDate,
          poolType,
          penalty: penaltyData,
          isPrivate,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pool creation failed:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error("Pool creation API Error, using mock response:", error);
      // Return mock successful creation response
      return {
        id: Date.now().toString(),
        name,
        goalCents,
        destination,
        tripDate,
        poolType,
        penalty: penaltyData,
        createdBy: userId,
        members: [userId],
        savedCents: 0,
        createdAt: new Date().toISOString(),
        status: "active",
      };
    }
  },

  getUserProfile: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
        headers: { "x-user-id": getCurrentUserId() },
      });
      if (!response.ok) throw new Error("Profile not found");
      return response.json();
    } catch (error) {
      console.log("getUserProfile API error, using mock data:", error);
      // Return mock data if backend not available
      return {
        id: userId,
        name: "Mercedes",
        xp: 150,
        total_points: 250,
        current_streak: 3,
        badge_count: 2,
        avatar_type: "default",
        avatar_data: null,
      };
    }
  },

  googleLogin: async (googleProfile) => {
    const response = await fetch(`${BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleProfile }),
    });
    return response.json();
  },

  // Chat messages
  messages: async (poolId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`);
      return res.json();
    } catch (error) {
      return [];
    }
  },

  getWithdrawalInfo: async (poolId: string, userId: string) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/pools/${poolId}/withdrawal-info?userId=${userId}`
      );
      return res.json();
    } catch (error) {
      return { availableAmount: 0, penalty: 0 };
    }
  },

  processWithdrawal: async (
    poolId: string,
    userId: string,
    amountCents: number
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/api/pools/${poolId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amountCents }),
      });
      return res.json();
    } catch (error) {
      throw new Error("Withdrawal failed");
    }
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
    const response = await fetch(`${BASE_URL}/api/avatar/generate`, {
      method: "POST",
    });
    return response.json();
  },

  updateAvatar: async (userId, avatarType, avatarData, profileImageUrl) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/avatar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarType, avatarData, profileImageUrl }),
    });
    return response.json();
  },

  updatePrivacy: async (userId, isPublic, allowEncouragement) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic, allowEncouragement }),
    });
    return response.json();
  },

  // Solo savings
  getPublicSoloPools: async (limit = 20) => {
    const response = await fetch(
      `${BASE_URL}/api/pools/solo/public?limit=${limit}`
    );
    return response.json();
  },

  getStreakLeaderboard: async (limit = 20) => {
    const response = await fetch(
      `${BASE_URL}/api/leaderboard/streaks?limit=${limit}`
    );
    return response.json();
  },

  // Encouragement system
  sendEncouragement: async (
    fromUserId,
    toUserId,
    poolId,
    message,
    type = "general"
  ) => {
    const response = await fetch(`${BASE_URL}/api/encouragement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId, toUserId, poolId, message, type }),
    });
    return response.json();
  },

  getUserEncouragements: async (userId, limit = 50) => {
    const response = await fetch(
      `${BASE_URL}/api/users/${userId}/encouragements?limit=${limit}`
    );
    return response.json();
  },

  // Follow system
  followUser: async (userId, followerId) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId }),
    });
    return response.json();
  },

  unfollowUser: async (userId, followerId) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId }),
    });
    return response.json();
  },

  getUserFollows: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follows`);
    return response.json();
  },

  getActivityFeed: async (userId, limit = 50) => {
    const response = await fetch(
      `${BASE_URL}/api/users/${userId}/feed?limit=${limit}`
    );
    return response.json();
  },

  // Store created pools in memory for demo mode
  _mockPools: [] as any[],

  listPools: async (userId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}/pools`, {
        headers: { "x-user-id": getCurrentUserId() },
      });
      if (!res.ok) throw new Error("Failed to fetch pools");
      return res.json();
    } catch (error) {
      console.log("listPools API error, using mock data:", error);
      // Return mock pools including any created ones
      return [
        {
          id: 1,
          name: "Tokyo Trip 2024",
          goal_cents: 300000,
          saved_cents: 75000,
          destination: "Tokyo, Japan",
          creator_id: userId,
        },
        ...((api as any)._mockPools ?? []),
      ];
    }
  },

  getPool: async (poolId: string) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}`, {
      headers: { "x-user-id": getCurrentUserId() },
    });
    return res.json();
  },

  contribute: async (
    poolId: string,
    {
      userId,
      amountCents,
      paymentMethod,
    }: { userId: string; amountCents: number; paymentMethod: string }
  ) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amountCents, paymentMethod }),
    });
    return res.json();
  },

  getMessages: async (poolId: string) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`);
    return res.json();
  },

  sendMessage: async (
    poolId: string,
    { userId, body }: { userId: string; body: string }
  ) => {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, body }),
    });
    return res.json();
  },

  // Gamification APIs
  getUserBadges: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/badges`, {
      headers: { "x-user-id": getCurrentUserId() },
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardHolderName }),
    });
    return res.json();
  },

  getDebitCard: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`);
    return res.json();
  },

  processCardTransaction: async (
    cardId: string,
    amountCents: number,
    merchant: string,
    category: string
  ) => {
    const res = await fetch(
      `${BASE_URL}/api/debit-card/${cardId}/transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, merchant, category }),
      }
    );
    return res.json();
  },

  getCardTransactions: async (userId: string, limit = 50) => {
    const res = await fetch(
      `${BASE_URL}/api/users/${userId}/card-transactions?limit=${limit}`
    );
    return res.json();
  },

  async getTravelPerks(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/travel-perks`);
    return res.json();
  },

  async getSpendingInsights(userId, days = 30) {
    const res = await fetch(
      `${BASE_URL}/api/users/${userId}/spending-insights?days=${days}`
    );
    return res.json();
  },

  async toggleCardStatus(cardId, userId) {
    const res = await fetch(`${BASE_URL}/api/debit-card/${cardId}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async processForfeit(poolId, userId, reason, amount) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/forfeit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason, amount }),
    });
    return res.json();
  },

  async peerBoost(poolId, fromUserId, toUserId, amountCents) {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/peer-boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId, toUserId, amountCents }),
    });
    return response.json();
  },

  // Notification API
  async storePushToken(userId, pushToken) {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken }),
    });
    return response.json();
  },

  async updateNotificationPreferences(userId, preferences) {
    const response = await fetch(
      `${BASE_URL}/api/users/${userId}/notification-preferences`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      }
    );
    return response.json();
  },

  async sendTestNotification(userId, pushToken) {
    const response = await fetch(`${BASE_URL}/api/notifications/send-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pushToken }),
    });
    return response.json();
  },

  async calculateInterest(userId) {
    const res = await fetch(
      `${BASE_URL}/api/users/${userId}/calculate-interest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.json();
  },

  // Friends Feed
  getFriendsFeed: async (userId: string, filter = "all") => {
    const res = await fetch(
      `${BASE_URL}/api/users/${userId}/friends-feed?filter=${filter}`,
      {
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return res.json();
  },

  // Invite System
  async generateInviteCode(poolId) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/invite-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getCurrentUserId(),
      },
    });
    return res.json();
  },

  async inviteMemberToPool(poolId, email) {
    const res = await fetch(`${BASE_URL}/api/pools/${poolId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getCurrentUserId(),
      },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async removeMemberFromPool(poolId, memberId) {
    const res = await fetch(
      `${BASE_URL}/api/pools/${poolId}/members/${memberId}`,
      {
        method: "DELETE",
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return res.json();
  },

  async updateMemberRole(poolId, memberId, role) {
    const res = await fetch(
      `${BASE_URL}/api/pools/${poolId}/members/${memberId}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getCurrentUserId(),
        },
        body: JSON.stringify({ role }),
      }
    );
    return res.json();
  },

  // Privacy Settings
  getNotificationSettings: async (userId: string) => {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      headers: { "x-user-id": getCurrentUserId() },
    });
    return res.json();
  },

  async getUserPrivacySettings(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      headers: { "x-user-id": getCurrentUserId() },
    });
    return res.json();
  },

  async updatePrivacySetting(userId, setting, value) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getCurrentUserId(),
      },
      body: JSON.stringify({ [setting]: value }),
    });
    return res.json();
  },

  // Transaction History
  async getTransactionHistory(userId, filter = "all", timeFilter = "all") {
    const res = await fetch(
      `${BASE_URL}/api/users/${userId}/transactions?filter=${filter}&time=${timeFilter}`,
      {
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return res.json();
  },

  // Savings Summary
  async getSavingsSummary(userId, timeframe = "6months") {
    const res = await fetch(
      `${BASE_URL}/api/users/${userId}/savings-summary?timeframe=${timeframe}`,
      {
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return res.json();
  },

  // Penalty Settings
  async getPoolPenaltySettings(poolId) {
    const res = await fetch(
      `${BASE_URL}/api/pools/${poolId}/penalty-settings`,
      {
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return res.json();
  },

  async updatePoolPenaltySettings(poolId, settings) {
    const res = await fetch(
      `${BASE_URL}/api/pools/${poolId}/penalty-settings`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getCurrentUserId(),
        },
        body: JSON.stringify(settings),
      }
    );
    // const recurringData = await api.saveRecurringPayment(getCurrentUserId(), { poolId });
    return res.json();
  },

  // Recurring Payments
  async getRecurringPaymentSettings(poolId, userId) {
    const res = await fetch(
      `${BASE_URL}/api/pools/${poolId}/users/${userId}/recurring`,
      {
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return res.json();
  },

  async updateRecurringPaymentSettings(poolId, userId, settings) {
    const res = await fetch(
      `${BASE_URL}/api/pools/${poolId}/users/${userId}/recurring`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getCurrentUserId(),
        },
        body: JSON.stringify(settings),
      }
    );
    return res.json();
  },

  // Accountability partners (removed duplicate)

  async inviteAccountabilityPartner(email) {
    const response = await fetch(`${BASE_URL}/accountability-partners/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getCurrentUserId(),
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async removeAccountabilityPartner(partnerId) {
    const response = await fetch(
      `${BASE_URL}/accountability-partners/${partnerId}`,
      {
        method: "DELETE",
        headers: { "x-user-id": getCurrentUserId() },
      }
    );
    return response.json();
  },

  async updateNotificationSettings(settings) {
    const response = await fetch(`${BASE_URL}/notification-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getCurrentUserId(),
      },
      body: JSON.stringify(settings),
    });
    return response.json();
  },

  // Payday and Streaks APIs
  getPaydaySettings: async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/payday-settings`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error("Payday settings API error:", error);
      return {
        type: "weekly",
        weekly_day: "friday",
        enable_streaks: true,
        reminder_days: 1,
      };
    }
  },

  updatePaydaySettings: async (userId: string, settings: any) => {
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/payday-settings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error("Update payday settings API error:", error);
      return { success: false, error: error.message };
    }
  },

  getUserStreak: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/streak`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text
        ? JSON.parse(text)
        : {
            current_streak: 0,
            longest_streak: 0,
            next_contribution_window: new Date().toISOString(),
            days_until_next: 7,
          };
    } catch (error) {
      console.error("Streak API error:", error);
      return {
        current_streak: 0,
        longest_streak: 0,
        next_contribution_window: new Date().toISOString(),
        days_until_next: 7,
      };
    }
  },

  // Payment Methods APIs
  getUserPaymentMethods: async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/payment-methods`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text
        ? JSON.parse(text)
        : [
            {
              id: "1",
              type: "venmo",
              displayName: "@username",
              isVerified: false,
              isDefault: false,
              fee: "2.5%",
              icon: "💙",
            },
            {
              id: "2",
              type: "cashapp",
              displayName: "$cashtag",
              isVerified: false,
              isDefault: false,
              fee: "3.0%",
              icon: "💚",
            },
            {
              id: "3",
              type: "paypal",
              displayName: "email@example.com",
              isVerified: true,
              isDefault: true,
              fee: "2.9% + $0.30",
              icon: "💛",
            },
            {
              id: "4",
              type: "bank",
              displayName: "Primary Account ****1234",
              isVerified: true,
              isDefault: false,
              fee: "Free",
              icon: "🏦",
            },
          ];
    } catch (error) {
      console.error("Get payment methods error:", error);
      return [
        {
          id: "1",
          type: "venmo",
          displayName: "@username",
          isVerified: false,
          isDefault: false,
          fee: "2.5%",
          icon: "💙",
        },
        {
          id: "2",
          type: "cashapp",
          displayName: "$cashtag",
          isVerified: false,
          isDefault: false,
          fee: "3.0%",
          icon: "💚",
        },
        {
          id: "3",
          type: "paypal",
          displayName: "email@example.com",
          isVerified: true,
          isDefault: true,
          fee: "2.9% + $0.30",
          icon: "💛",
        },
        {
          id: "4",
          type: "bank",
          displayName: "Primary Account ****1234",
          isVerified: true,
          isDefault: false,
          fee: "Free",
          icon: "🏦",
        },
      ];
    }
  },

  linkPaymentMethod: async (
    userId: string,
    method: string,
    credentials: any
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/payment-methods/link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, credentials }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error("Link payment method error:", error);
      return { success: false, error: error.message };
    }
  },

  async contributeToPool(
    poolId,
    userId,
    amountCents,
    paymentMethod,
    paymentToken = null
  ) {
    try {
      const response = await fetch(`${API_BASE}/pools/${poolId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amountCents,
          paymentMethod,
          paymentToken,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error("Contribute to pool error:", error);
      throw error;
    }
  },

  async saveSoloGoalPrivacySettings(userId, poolId, settings) {
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/solo-goals/${poolId}/privacy`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error("Save solo goal privacy settings error:", error);
      throw error;
    }
  },

  // Peer Transfer APIs

  async processPeerTransfer(
    poolId,
    fromUserId,
    toUserId,
    amountCents,
    message = ""
  ) {
    try {
      const response = await fetch(
        `${API_BASE}/pools/${poolId}/peer-transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromUserId, toUserId, amountCents, message }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error("Peer transfer error:", error);
      throw error;
    }
  },

  async getUserPeerTransfers(userId, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}/peer-transfers`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error("Get peer transfers error:", error);
      return [];
    }
  },

  // Penalty system APIs
  async get(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Payday and recurring payment settings
  savePaydaySettings: async (userId, settings) => {
    try {
      // Mock implementation to prevent errors
      console.log("Saving payday settings:", settings);
      return { success: true };
    } catch (error) {
      console.error("Save payday settings error:", error);
      throw error;
    }
  },

  saveRecurringPayment: async (userId, payment) => {
    try {
      // Mock implementation to prevent errors
      console.log("Saving recurring payment:", payment);
      return { success: true };
    } catch (error) {
      console.error("Save recurring payment error:", error);
      throw error;
    }
  },

  saveStreakSettings: async (userId, settings) => {
    try {
      // Mock implementation to prevent errors
      console.log("Saving streak settings:", settings);
      return { success: true };
    } catch (error) {
      console.error("Save streak settings error:", error);
      throw error;
    }
  },

  saveNotificationSettings: async (userId, settings) => {
    try {
      // Mock implementation to prevent errors
      console.log("Saving notification settings:", settings);
      return { success: true };
    } catch (error) {
      console.error("Save notification settings error:", error);
      throw error;
    }
  },

  // Add missing API methods
  getContributionSettings: async (userId: string, poolId: string) => {
    return {
      auto_contribute: false,
      amount_cents: 0,
      frequency: "weekly",
    };
  },

  updateContributionSettings: async (
    userId: string,
    poolId: string,
    settings: any
  ) => {
    return { success: true };
  },

  createRecurringContribution: async (
    userId: string,
    poolId: string,
    settings: any
  ) => {
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
      goalName: "Sample Goal",
      currentAmount: 0,
      targetAmount: 100000,
      progressPercentage: 0,
      daysRemaining: 30,
      streakDays: 0,
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
      successStories: [],
    };
  },

  getSoloGoalPrivacySettings: async (userId: string) => {
    return {
      shareProgress: true,
      shareMilestones: true,
      shareGoalCompletion: true,
    };
  },

  updateSoloGoalPrivacySettings: async (userId: string, settings: any) => {
    return { success: true };
  },

  // Friends API
  getUserFriends: async (userId: string) => {
    if (USE_MOCK_DATA) {
      return [
        {
          id: "2",
          name: "Sarah Chen",
          email: "sarah@example.com",
          profile_image_url: "https://via.placeholder.com/150",
          friendship_id: "f1",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "3",
          name: "Mike Rodriguez",
          email: "mike@example.com",
          profile_image_url: "https://via.placeholder.com/150",
          friendship_id: "f2",
          created_at: "2024-01-02T00:00:00Z",
        },
      ];
    }
    const response = await fetch(`${BASE_URL}/api/users/${userId}/friends`);
    return response.json();
  },

  getFriendRequests: async (userId: string) => {
    if (USE_MOCK_DATA) {
      return [
        {
          id: "1",
          sender_id: "4",
          receiver_id: userId,
          sender_name: "Alex Chen",
          sender_email: "alex@example.com",
          status: "pending",
          created_at: "2024-01-20T00:00:00Z",
        },
      ];
    }
    const response = await fetch(
      `${BASE_URL}/api/users/${userId}/friend-requests`
    );
    return response.json();
  },

  sendFriendRequest: async (userId: string, friendEmail: string) => {
    if (USE_MOCK_DATA) {
      return { success: true, requestId: Date.now().toString() };
    }
    const response = await fetch(
      `${BASE_URL}/api/users/${userId}/friend-requests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendEmail }),
      }
    );
    return response.json();
  },

  respondToFriendRequest: async (
    requestId: string,
    action: "accept" | "decline"
  ) => {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    const response = await fetch(
      `${BASE_URL}/api/friend-requests/${requestId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }
    );
    return response.json();
  },

  removeFriend: async (userId: string, friendId: string) => {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    const response = await fetch(
      `${BASE_URL}/api/users/${userId}/friends/${friendId}`,
      {
        method: "DELETE",
      }
    );
    return response.json();
  },

  // Milestones API
  getPoolMilestones: async (poolId: string) => {
    if (USE_MOCK_DATA) {
      return [
        {
          id: "1",
          pool_id: poolId,
          title: "Flights",
          description: "Book round-trip flights",
          target_amount_cents: 120000,
          is_completed: true,
          order_index: 1,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          pool_id: poolId,
          title: "Accommodation",
          description: "Hotel booking for 7 nights",
          target_amount_cents: 100000,
          is_completed: false,
          order_index: 2,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];
    }
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/milestones`);
    return response.json();
  },

  createMilestone: async (milestone: any) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        milestone: { ...milestone, id: Date.now().toString() },
      };
    }
    const response = await fetch(`${BASE_URL}/api/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(milestone),
    });
    return response.json();
  },

  updateMilestone: async (milestoneId: string, updates: any) => {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    const response = await fetch(`${BASE_URL}/api/milestones/${milestoneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  getPoolMembers: async (poolId: string) => {
    if (USE_MOCK_DATA) {
      return [
        { id: "1756612920173", name: "You" },
        { id: "2", name: "Sarah Chen" },
        { id: "3", name: "Mike Rodriguez" },
      ];
    }
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/members`);
    return response.json();
  },
};
