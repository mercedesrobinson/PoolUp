import { API_BASE, BASE_URL, getCurrentUserId, request } from './client';

export const payments = {
  // One-off contributions
  contribute: async (
    poolId: string,
    { userId, amountCents, paymentMethod }: { userId: string; amountCents: number; paymentMethod: string }
  ) =>
    request(`${API_BASE()}/contributions`, {
      method: 'POST',
      headers: { 'x-user-id': getCurrentUserId() },
      body: {
        pool_id: Number(poolId),
        user_id: Number(userId) || 1,
        amount: Number(amountCents),
        description: paymentMethod || 'manual',
      },
    }),

  // Mocked higher-level helper used elsewhere
  contributeToPool: async (
    poolId: string,
    userId: string,
    amountCents: number,
    paymentMethod: string,
    paymentToken: string | null = null
  ) => {
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, contributionId: Date.now().toString() } as any;
  },

  // Payment methods (mostly mocked)
  getUserPaymentMethods: async (userId: string) => {
    await new Promise((r) => setTimeout(r, 300));
    return {
      venmo: { linked: false, username: null },
      cashapp: { linked: false, cashtag: null },
      paypal: { linked: false, email: null },
      bank: { linked: true, accountName: 'Primary Account' },
    } as any;
  },
  linkPaymentMethod: async (userId: string, method: string, credentials: any) => {
    await new Promise((r) => setTimeout(r, 500));
    return { success: true } as any;
  },
  setDefaultPaymentMethod: async (userId: string, methodId: string) => ({ success: true } as any),
  removePaymentMethod: async (userId: string, methodId: string) => ({ success: true } as any),
  getPaymentMethods: async (userId: string) => [] as any[],

  // Recurring payments
  getRecurringPaymentSettings: async (poolId: string, userId: string) =>
    request(`${BASE_URL()}/api/pools/${poolId}/users/${userId}/recurring`, {
      headers: { 'x-user-id': getCurrentUserId() },
    }),
  updateRecurringPaymentSettings: async (poolId: string, userId: string, settings: any) =>
    request(`${BASE_URL()}/api/pools/${poolId}/users/${userId}/recurring`, {
      method: 'PUT',
      headers: { 'x-user-id': getCurrentUserId() },
      body: settings,
    }),
  getRecurringPayments: async (userId: string) => [] as any[],
  toggleRecurringPayment: async (paymentId: string, enabled: boolean) => ({ success: true } as any),
  deleteRecurringPayment: async (paymentId: string) => ({ success: true } as any),

  // Contribution settings (mocked)
  getContributionSettings: async (userId: string, poolId: string) => ({
    auto_contribute: false,
    amount_cents: 0,
    frequency: 'weekly',
  }) as any,
  updateContributionSettings: async (userId: string, poolId: string, settings: any) => ({ success: true } as any),
  createRecurringContribution: async (userId: string, poolId: string, settings: any) => ({ success: true } as any),
};

