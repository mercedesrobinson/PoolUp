import { API_BASE, BASE_URL, getCurrentUserId, request } from './client';

export const users = {
  getUserProfile: async (userId: string) => {
    try {
      return await request(`${API_BASE()}/users/${userId}/profile`, {
        headers: { 'x-user-id': getCurrentUserId() },
      });
    } catch (error) {
      return {
        id: userId,
        name: 'User',
        xp: 0,
        total_points: 0,
        current_streak: 0,
        badge_count: 0,
        profile_image_url: null,
      } as any;
    }
  },

  getUserBadges: async (userId: string) =>
    request(`${BASE_URL()}/api/users/${userId}/badges`, {
      headers: { 'x-user-id': getCurrentUserId() },
    }),

  getUserStreak: async (userId: string) => {
    try {
      return await request(`${API_BASE()}/users/${userId}/streak`, {
        headers: { 'x-user-id': getCurrentUserId() },
      });
    } catch (error) {
      return { current_streak: 0, longest_streak: 0, streak_start_date: null } as any;
    }
  },

  // Privacy/notification settings (user-scoped)
  getNotificationSettings: async (userId: string) =>
    request(`${BASE_URL()}/api/users/${userId}/privacy`, {
      headers: { 'x-user-id': getCurrentUserId() },
    }),

  getUserPrivacySettings: async (userId: string) =>
    request(`${BASE_URL()}/api/users/${userId}/privacy`, {
      headers: { 'x-user-id': getCurrentUserId() },
    }),

  updatePrivacySetting: async (userId: string, setting: string, value: any) =>
    request(`${BASE_URL()}/api/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'x-user-id': getCurrentUserId() },
      body: { [setting]: value },
    }),

  // Push, notifications, interest
  storePushToken: async (userId: string, pushToken: string) =>
    request(`${BASE_URL()}/api/users/${userId}/push-token`, {
      method: 'POST',
      body: { pushToken },
    }),

  updateNotificationPreferences: async (userId: string, preferences: any) =>
    request(`${BASE_URL()}/api/users/${userId}/notification-preferences`, {
      method: 'POST',
      body: preferences,
    }),

  sendTestNotification: async (userId: string, pushToken: string) =>
    request(`${BASE_URL()}/api/notifications/send-test`, {
      method: 'POST',
      body: { userId, pushToken },
    }),

  calculateInterest: async (userId: string) =>
    request(`${BASE_URL()}/api/users/${userId}/calculate-interest`, { method: 'POST' }),
};

