import { BASE_URL, request } from './client';

export const social = {
  // Solo/public feed & leaderboards (mocked lists)
  getPublicSoloPools: async (limit = 20) => {
    await new Promise((r) => setTimeout(r, 300));
    return [] as any[];
  },
  getStreakLeaderboard: async (limit = 20) => {
    await new Promise((r) => setTimeout(r, 300));
    return [] as any[];
  },

  getFriendsFeed: async (userId: string, filter: string = 'all') => {
    try {
      return await request(`${BASE_URL()}/api/users/${userId}/friends-feed?filter=${filter}`);
    } catch (e) {
      return [] as any[];
    }
  },

  // Encouragement (mock)
  sendEncouragement: async (fromUserId: string, toUserId: string, poolId: string, message: string, type = 'general') => {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true, encouragementId: Date.now().toString() } as any;
  },
  getUserEncouragements: async (userId: string, limit = 50) => {
    await new Promise((r) => setTimeout(r, 300));
    return [] as any[];
  },

  // Follow system (mock)
  followUser: async (userId: string, followerId: string) => ({ success: true, following: true } as any),
  unfollowUser: async (userId: string, followerId: string) => ({ success: true, following: false } as any),
  getUserFollows: async (userId: string) => ({ following: [], followers: [] } as any),
  getActivityFeed: async (userId: string, limit = 50) => [] as any[],

  // Social feed/proof (mock)
  getSocialFeed: async (userId: string) => [] as any[],
  toggleFeedItemLike: async (feedItemId: string, userId: string) => ({ success: true } as any),
  getSocialProofData: async () => ({
    totalUsers: 10000,
    totalSaved: 5000000,
    goalsCompleted: 2500,
    averageSuccess: 85,
    averageStreak: 12,
    successStories: [],
  }) as any,
};

