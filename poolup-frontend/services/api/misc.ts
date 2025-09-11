import { BASE_URL, getCurrentUserId, request } from './client';

export const misc = {
  // Generic helpers (mock implementations preserved)
  get: async (endpoint: string) => {
    await new Promise((r) => setTimeout(r, 300));
    return { data: [] } as any;
  },
  post: async (endpoint: string, data: any) => {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true, data: { id: Date.now().toString() } } as any;
  },

  // Payday & streak settings
  getPaydaySettings: async (userId: string) => {
    try {
      const text = await fetch(`${BASE_URL()}/api/users/${userId}/payday-settings`).then((r) => r.text());
      return text ? JSON.parse(text) : {};
    } catch (e: any) {
      return { type: 'weekly', weekly_day: 'friday', enable_streaks: true, reminder_days: 1 } as any;
    }
  },
  updatePaydaySettings: async (userId: string, settings: any) => {
    try {
      const res = await fetch(`${BASE_URL()}/api/users/${userId}/payday-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const text = await res.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (e: any) {
      return { success: false, error: e.message } as any;
    }
  },
  savePaydaySettings: async (userId: string, settings: any) => ({ success: true } as any),
  saveRecurringPayment: async (userId: string, payment: any) => ({ success: true } as any),
  saveStreakSettings: async (userId: string, settings: any) => ({ success: true } as any),
  saveNotificationSettings: async (userId: string, settings: any) => ({ success: true } as any),
  trackEvent: async (eventName: string, properties?: any) => ({ success: true } as any),

  // Withdrawals (mock)
  getWithdrawalInfo: async (poolId: string, userId: string) => ({ availableAmount: 0, penalty: 0 } as any),
  processWithdrawal: async (poolId: string, userId: string, amountCents: number) => ({
    success: true,
    withdrawalId: Date.now().toString(),
  } as any),

  // Accountability partners and notifications
  inviteAccountabilityPartner: async (email: string) =>
    request(`${BASE_URL()}/accountability-partners/invite`, {
      method: 'POST',
      headers: { 'x-user-id': getCurrentUserId() },
      body: { email },
    }),
  removeAccountabilityPartner: async (partnerId: string) =>
    request(`${BASE_URL()}/accountability-partners/${partnerId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getCurrentUserId() },
    }),
  updateNotificationSettings: async (settings: any) =>
    request(`${BASE_URL()}/notification-settings`, {
      method: 'PUT',
      headers: { 'x-user-id': getCurrentUserId() },
      body: settings,
    }),

  // Group activity (mock)
  getGroupActivity: async (poolId: string, userId: string) => [] as any[],
  inviteToPool: async (poolId: string, email: string) => ({ success: true } as any),
  changeMemberRole: async (poolId: string, memberId: string, role: string) => ({ success: true } as any),
  inviteToApp: async (email: string) => ({ success: true } as any),
  getAccountabilityPartners: async () => [] as any[],
  uploadProfilePhoto: async (userId: string, imageData: string) => ({ success: true } as any),
};
