import { BASE_URL, request } from './client';

export const analytics = {
  // Transaction history
  getTransactionHistory: async (userId: string, filter = 'all', timeFilter = 'all') =>
    request(`${BASE_URL()}/api/users/${userId}/transactions?filter=${filter}&time=${timeFilter}`),

  // Savings summary
  getSavingsSummary: async (userId: string, timeframe = '6months') =>
    request(`${BASE_URL()}/api/users/${userId}/savings-summary?timeframe=${timeframe}`),

  // Pool progress (mock)
  getPoolProgress: async (poolId: string) => ({
    goalName: 'Sample Goal',
    currentAmount: 0,
    targetAmount: 100000,
    progressPercentage: 0,
    daysRemaining: 30,
    streakDays: 0,
  }) as any,

  // Travel perks and spending insights
  getTravelPerks: async (userId: string) => request(`${BASE_URL()}/api/users/${userId}/travel-perks`),
  getSpendingInsights: async (userId: string, days = 30) =>
    request(`${BASE_URL()}/api/users/${userId}/spending-insights?days=${days}`),
};

