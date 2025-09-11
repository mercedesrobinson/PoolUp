import { API_BASE, request } from './client';

export const messages = {
  // simple mock list
  messages: async (poolId: string) => {
    await new Promise((r) => setTimeout(r, 300));
    return [] as any[];
  },
  getMessages: async (poolId: string) =>
    request(`${API_BASE()}/messages/${poolId}`).then((json: any) => json?.data || json || []),
  sendMessage: async (poolId: string, { userId, body }: { userId: string; body: string }) =>
    request(`${API_BASE()}/messages`, {
      method: 'POST',
      body: { pool_id: Number(poolId), user_id: Number(userId) || 1, content: body },
    }).then((json: any) => json?.data || json || []),
};

