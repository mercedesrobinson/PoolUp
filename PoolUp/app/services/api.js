const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';
const SERVER = BASE_URL; // 👈 make sure SERVER is always defined

export const api = {
  // ---- Auth ----
  async guestLogin(name) {
    const res = await fetch(`${BASE_URL}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`Guest login failed: ${res.status}`);
    return res.json();
  },

  // Backwards-compatible alias so api.guest() also works
  async guest(name) {
    return this.guestLogin(name);
  },

  async googleLogin(googleProfile) {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleProfile }),
    });
    return res.json();
  },

  // ---- Avatar system ----
  async getAvatarOptions() {
    const res = await fetch(`${BASE_URL}/api/avatar/options`);
    return res.json();
  },

  async getAvatarPresets() {
    const res = await fetch(`${BASE_URL}/api/avatar/presets`);
    return res.json();
  },

  async generateAvatar() {
    const res = await fetch(`${BASE_URL}/api/avatar/generate`, { method: 'POST' });
    return res.json();
  },

  async updateAvatar(userId, avatarType, avatarData, profileImageUrl) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarType, avatarData, profileImageUrl }),
    });
    return res.json();
  },

  async updatePrivacy(userId, isPublic, allowEncouragement) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic, allowEncouragement }),
    });
    return res.json();
  },

  // ---- Pools ----
  async createPool(ownerId, name, goalCents, destination, tripDate, poolType = 'group') {
    const res = await fetch(`${BASE_URL}/api/pools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, name, goalCents, destination, tripDate, poolType }),
    });
    return res.json();
  },

  async listPools(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/pools`);
    return res.json();
  },

  async getPool(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}`);
    return res.json();
  },

  async contribute(poolId, { userId, amountCents, paymentMethod }) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amountCents, paymentMethod }),
    });
    return res.json();
  },

  // ---- Solo savings & Leaderboard ----
  async getPublicSoloPools(limit = 20) {
    const res = await fetch(`${BASE_URL}/api/pools/solo/public?limit=${limit}`);
    return res.json();
  },

  async getStreakLeaderboard(limit = 20) {
    const res = await fetch(`${BASE_URL}/api/leaderboard/streaks?limit=${limit}`);
    return res.json();
  },

  // ---- Messages ----
  async getMessages(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/messages`);
    return res.json();
  },

  async sendMessage(poolId, { userId, body }) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, body }),
    });
    return res.json();
  },

  // ---- Encouragement system ----
  async sendEncouragement(fromUserId, toUserId, poolId, message, type = 'general') {
    const res = await fetch(`${BASE_URL}/api/encouragement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId, poolId, message, type }),
    });
    return res.json();
  },

  async getUserEncouragements(userId, limit = 50) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/encouragements?limit=${limit}`);
    return res.json();
  },

  // ---- Follow system ----
  async followUser(userId, followerId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return res.json();
  },

  async unfollowUser(userId, followerId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/follow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return res.json();
  },

  async getUserFollows(userId) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/follows`);
    return res.json();
  },

  async getActivityFeed(userId, limit = 50) {
    const res = await fetch(`${BASE_URL}/api/users/${userId}/feed?limit=${limit}`);
    return res.json();
  },

  // ---- Gamification APIs ----
  async getUserProfile(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/profile`);
    return res.json();
  },

  async getUserBadges(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/badges`);
    return res.json();
  },

  async getLeaderboard(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/leaderboard`);
    return res.json();
  },

  async getChallenges(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/challenges`);
    return res.json();
  },

  async getUnlockables(poolId) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/unlockables`);
    return res.json();
  },

  // ---- Debit Card APIs ----
  async createDebitCard(userId, cardHolderName) {
    const res = await fetch(`${SERVER}/api/users/${userId}/debit-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardHolderName }),
    });
    return res.json();
  },

  async getDebitCard(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/debit-card`);
    return res.json();
  },

  async processCardTransaction(cardId, amountCents, merchant, category) {
    const res = await fetch(`${SERVER}/api/debit-card/${cardId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, merchant, category }),
    });
    return res.json();
  },

  async getCardTransactions(userId, limit = 50) {
    const res = await fetch(`${SERVER}/api/users/${userId}/card-transactions?limit=${limit}`);
    return res.json();
  },

  async getTravelPerks(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/travel-perks`);
    return res.json();
  },

  async getSpendingInsights(userId, days = 30) {
    const res = await fetch(`${SERVER}/api/users/${userId}/spending-insights?days=${days}`);
    return res.json();
  },

  async toggleCardStatus(cardId, userId) {
    const res = await fetch(`${SERVER}/api/debit-card/${cardId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async processForfeit(poolId, userId, reason, amount) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/forfeit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason, amount }),
    });
    return res.json();
  },

  async peerBoost(poolId, boosterUserId, targetUserId, amountCents) {
    const res = await fetch(`${SERVER}/api/pools/${poolId}/peer-boost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boosterUserId, targetUserId, amountCents }),
    });
    return res.json();
  },

  async calculateInterest(userId) {
    const res = await fetch(`${SERVER}/api/users/${userId}/calculate-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }
};
