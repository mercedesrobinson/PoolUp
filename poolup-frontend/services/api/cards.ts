import { BASE_URL, request } from './client';

export const cards = {
  createDebitCard: async (userId: string, cardHolderName: string) =>
    request(`${BASE_URL()}/api/users/${userId}/debit-card`, {
      method: 'POST',
      body: { cardHolderName },
    }),

  getDebitCard: async (userId: string) => request(`${BASE_URL()}/api/users/${userId}/debit-card`),

  processCardTransaction: async (cardId: string, amountCents: number, merchant: string, category: string) =>
    request(`${BASE_URL()}/api/debit-card/${cardId}/transaction`, {
      method: 'POST',
      body: { amountCents, merchant, category },
    }),

  getCardTransactions: async (userId: string, limit = 50) =>
    request(`${BASE_URL()}/api/users/${userId}/card-transactions?limit=${limit}`),

  toggleCardStatus: async (cardId: string, userId: string) =>
    request(`${BASE_URL()}/api/debit-card/${cardId}/toggle`, {
      method: 'PATCH',
      body: { userId },
    }),
};

