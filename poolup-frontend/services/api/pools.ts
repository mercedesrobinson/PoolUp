import { API_BASE, BASE_URL, getCurrentUserId, request } from './client';

export const pools = {
  createPool: async (
    userId: string,
    name: string,
    goalCents: number,
    destination: string,
    tripDate: string,
    poolType: string,
    penaltyData: any
  ) => {
    const createdByNum = Number(userId);
    return request(`${API_BASE()}/pools`, {
      method: 'POST',
      headers: { 'x-user-id': getCurrentUserId() },
      body: {
        name,
        goal_amount: goalCents,
        description: destination,
        created_by: Number.isFinite(createdByNum) ? createdByNum : Number(getCurrentUserId()),
        target_date: tripDate,
        pool_type: poolType,
        public_visibility: false,
        penalty_data: penaltyData,
      },
    });
  },

  listPools: async (userId: string) =>
    request(`${API_BASE()}/users/${userId}/pools`, { headers: { 'x-user-id': getCurrentUserId() } }).then(
      (json: any) => json?.data || json || []
    ),

  getPool: async (poolId: string) =>
    request(`${API_BASE()}/pools/${poolId}`, { headers: { 'x-user-id': getCurrentUserId() } }),

  // Members & invites
  generateInviteCode: async (poolId: string) =>
    request(`${BASE_URL()}/api/pools/${poolId}/invite-code`, {
      method: 'POST',
      headers: { 'x-user-id': getCurrentUserId() },
    }),

  inviteMemberToPool: async (poolId: string, email: string) =>
    request(`${BASE_URL()}/api/pools/${poolId}/invite`, {
      method: 'POST',
      headers: { 'x-user-id': getCurrentUserId() },
      body: { email },
    }),

  removeMemberFromPool: async (poolId: string, memberId: string | number) =>
    request(`${BASE_URL()}/api/pools/${poolId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getCurrentUserId() },
    }),

  updateMemberRole: async (poolId: string, memberId: string | number, role: string) =>
    request(`${BASE_URL()}/api/pools/${poolId}/members/${memberId}/role`, {
      method: 'PUT',
      headers: { 'x-user-id': getCurrentUserId() },
      body: { role },
    }),

  getPoolMembers: async (poolId: string) => {
    // currently mocked in original api
    await new Promise((r) => setTimeout(r, 300));
    return [] as any[];
  },

  // Penalty settings
  getPoolPenaltySettings: async (poolId: string) =>
    request(`${BASE_URL()}/api/pools/${poolId}/penalty-settings`, {
      headers: { 'x-user-id': getCurrentUserId() },
    }),

  updatePoolPenaltySettings: async (poolId: string, settings: any) =>
    request(`${BASE_URL()}/api/pools/${poolId}/penalty-settings`, {
      method: 'PUT',
      headers: { 'x-user-id': getCurrentUserId() },
      body: settings,
    }),

  // Peer boost (pool-scoped)
  peerBoost: async (poolId: string, fromUserId: string, toUserId: string, amountCents: number) =>
    request(`${BASE_URL()}/api/pools/${poolId}/peer-boost`, {
      method: 'POST',
      body: { fromUserId, toUserId, amountCents },
    }),

  // Gamification endpoints
  getLeaderboard: async (poolId: string) => request(`${BASE_URL()}/api/pools/${poolId}/leaderboard`),
  getChallenges: async (poolId: string) => request(`${BASE_URL()}/api/pools/${poolId}/challenges`),
  getUnlockables: async (poolId: string) => request(`${BASE_URL()}/api/pools/${poolId}/unlockables`),
};
