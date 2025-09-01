import { 
  User, 
  Pool, 
  Contribution, 
  PaymentMethod, 
  PeerTransfer, 
  DebitCard, 
  Badge, 
  Activity, 
  Charity, 
  PenaltySettings, 
  PaydaySettings, 
  RecurringPayment, 
  ApiResponse, 
  ApiError 
} from '../types/api';

const API_BASE = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

// Get current user ID from storage
const getCurrentUserId = (): string => {
  // For development, use a default user ID
  return '1756612920173';
};

// Safe JSON parsing helper
const safeJsonParse = async (response: Response): Promise<any> => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

// API service for PoolUp
export const api = {
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
      console.log('API Error - using mock data:', error);
      return { 
        id: Date.now().toString(), 
        name, 
        email: undefined, 
        created_at: new Date().toISOString() 
      };
    }
  },

  // Google OAuth user creation
  createGoogleUser: async (googleUser: any): Promise<User> => {
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
        id: Date.now().toString(),
        name: googleUser.name,
        email: googleUser.email,
        profile_image_url: googleUser.photo,
        created_at: new Date().toISOString()
      };
    }
  },

  // Pools
  createPool: async (
    userId: string, 
    name: string, 
    goalCents: number, 
    destination: string, 
    tripDate: string, 
    poolType: 'group' | 'solo' = 'group', 
    penaltyData: PenaltySettings | null = null
  ): Promise<Pool> => {
    try {
      const response = await fetch(`${API_BASE}/pools`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId 
        },
        body: JSON.stringify({
          userId,
          name,
          goalCents,
          destination,
          tripDate,
          poolType,
          penalty: penaltyData
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pool creation failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return await safeJsonParse(response);
    } catch (error) {
      console.error('Pool creation API Error:', error);
      throw error;
    }
  },

  listPools: async (userId: string): Promise<Pool[]> => {
    try {
      const response = await fetch(`${API_BASE}/pools?userId=${userId}`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || [];
    } catch (error) {
      console.error('List pools API error:', error);
      return [];
    }
  },

  getPool: async (poolId: string): Promise<Pool> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}`, {
      headers: { 'x-user-id': getCurrentUserId() }
    });
    return response.json();
  },

  getUserProfile: async (userId: string): Promise<User> => {
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
        created_at: new Date().toISOString()
      };
    }
  },

  getUserBadges: async (userId: string): Promise<Badge[]> => {
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

  // Contributions
  contribute: async (poolId: string, data: { userId: string; amountCents: number; paymentMethod: string }): Promise<Contribution> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  contributeToPool: async (
    poolId: string, 
    userId: string, 
    amountCents: number, 
    paymentMethod: string, 
    paymentToken: string | null = null
  ): Promise<ApiResponse<Contribution>> => {
    try {
      const response = await fetch(`${API_BASE}/pools/${poolId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amountCents, paymentMethod, paymentToken })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || { success: true };
    } catch (error) {
      console.error('Contribute to pool error:', error);
      throw error;
    }
  },

  // Messages
  getMessages: async (poolId: string): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`);
    return response.json();
  },

  sendMessage: async (poolId: string, data: { userId: string; body: string }): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Debit Card APIs
  createDebitCard: async (userId: string, cardHolderName: string): Promise<DebitCard> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardHolderName })
    });
    return response.json();
  },

  getDebitCard: async (userId: string): Promise<DebitCard | null> => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/debit-card`);
      if (!response.ok) throw new Error('Card not found');
      return response.json();
    } catch (error) {
      return null; // Return null if no card exists
    }
  },

  toggleCardStatus: async (cardId: string, userId: string): Promise<DebitCard> => {
    const response = await fetch(`${BASE_URL}/api/debit-card/${cardId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return response.json();
  },

  // Payment Methods APIs
  getUserPaymentMethods: async (userId: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/payment-methods`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || {
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

  linkPaymentMethod: async (userId: string, method: string, credentials: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/payment-methods/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, credentials })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || { success: true };
    } catch (error) {
      console.error('Link payment method error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Peer Transfer APIs
  getPoolMembers: async (poolId: string): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE}/pools/${poolId}/members`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || [];
    } catch (error) {
      console.error('Get pool members error:', error);
      return [];
    }
  },

  processPeerTransfer: async (
    poolId: string, 
    fromUserId: string, 
    toUserId: string, 
    amountCents: number, 
    message: string = ''
  ): Promise<ApiResponse<PeerTransfer>> => {
    try {
      const response = await fetch(`${API_BASE}/pools/${poolId}/peer-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId, toUserId, amountCents, message })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || { success: true };
    } catch (error) {
      console.error('Peer transfer error:', error);
      throw error;
    }
  },

  getUserPeerTransfers: async (userId: string): Promise<PeerTransfer[]> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/peer-transfers`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || [];
    } catch (error) {
      console.error('Get peer transfers error:', error);
      return [];
    }
  },

  // Gamification APIs
  getLeaderboard: async (poolId: string): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/leaderboard`);
    return response.json();
  },

  getChallenges: async (poolId: string): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/challenges`);
    return response.json();
  },

  getUnlockables: async (poolId: string): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/unlockables`);
    return response.json();
  },

  // Avatar system
  getAvatarOptions: async (): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/avatar/options`);
    return response.json();
  },

  getAvatarPresets: async (): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/avatar/presets`);
    return response.json();
  },

  generateAvatar: async (): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/avatar/generate`, { method: 'POST' });
    return response.json();
  },

  updateAvatar: async (userId: string, avatarType: string, avatarData: any, profileImageUrl?: string): Promise<User> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarType, avatarData, profileImageUrl }),
    });
    return response.json();
  },

  // Privacy settings
  updatePrivacy: async (userId: string, isPublic: boolean, allowEncouragement: boolean): Promise<User> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic, allowEncouragement }),
    });
    return response.json();
  },

  // Solo savings
  getPublicSoloPools: async (limit: number = 20): Promise<Pool[]> => {
    const response = await fetch(`${BASE_URL}/api/pools/solo/public?limit=${limit}`);
    return response.json();
  },

  getStreakLeaderboard: async (limit: number = 20): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/leaderboard/streaks?limit=${limit}`);
    return response.json();
  },

  // Encouragement system
  sendEncouragement: async (
    fromUserId: string, 
    toUserId: string, 
    poolId: string, 
    message: string, 
    type: string = 'general'
  ): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/encouragement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId, poolId, message, type }),
    });
    return response.json();
  },

  getUserEncouragements: async (userId: string, limit: number = 50): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/encouragements?limit=${limit}`);
    return response.json();
  },

  // Follow system
  followUser: async (userId: string, followerId: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return response.json();
  },

  unfollowUser: async (userId: string, followerId: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return response.json();
  },

  getUserFollows: async (userId: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/follows`);
    return response.json();
  },

  getActivityFeed: async (userId: string, limit: number = 50): Promise<Activity[]> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/feed?limit=${limit}`);
    return response.json();
  },

  // Friends Feed
  getFriendsFeed: async (userId: string, filter: string = 'all'): Promise<Activity[]> => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/friends-feed?filter=${filter}`, {
        headers: { 'x-user-id': getCurrentUserId() }
      });
      return response.json();
    } catch (error) {
      console.error('Get friends feed error:', error);
      throw error;
    }
  },

  // Invite System
  generateInviteCode: async (poolId: string): Promise<string> => {
    try {
      const response = await fetch(`${BASE_URL}/api/pools/${poolId}/invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() }
      });
      const data = await response.json();
      return data.code || `POOL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    } catch (error) {
      console.error('Generate invite code error:', error);
      return `POOL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
  },

  inviteMemberToPool: async (poolId: string, email: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/pools/${poolId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getCurrentUserId() },
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  // Payday Settings
  getPaydaySettings: async (userId: string): Promise<PaydaySettings> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/payday-settings`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || {
        frequency: 'weekly',
        days: ['friday'],
        dates: []
      };
    } catch (error) {
      console.error('Payday settings API error:', error);
      return {
        frequency: 'weekly',
        days: ['friday'],
        dates: []
      };
    }
  },

  updatePaydaySettings: async (userId: string, settings: PaydaySettings): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/payday-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || { success: true };
    } catch (error) {
      console.error('Update payday settings API error:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  getUserStreak: async (userId: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/streak`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await safeJsonParse(response) || {
        current_streak: 0,
        longest_streak: 0,
        next_contribution_window: new Date().toISOString(),
        days_until_next: 7
      };
    } catch (error) {
      console.error('Streak API error:', error);
      return {
        current_streak: 0,
        longest_streak: 0,
        next_contribution_window: new Date().toISOString(),
        days_until_next: 7
      };
    }
  },

  // Card Transaction Processing
  processCardTransaction: async (cardId: string, amountCents: number, merchant: string, category: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/debit-card/${cardId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, merchant, category })
    });
    return response.json();
  },

  getCardTransactions: async (userId: string, limit: number = 50): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/card-transactions?limit=${limit}`);
    return response.json();
  },

  getTravelPerks: async (userId: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/travel-perks`);
    return response.json();
  },

  getSpendingInsights: async (userId: string, days: number = 30): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/spending-insights?days=${days}`);
    return response.json();
  },

  // Generic API helpers
  get: async (endpoint: string): Promise<any> => {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return response.json();
  },

  post: async (endpoint: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
