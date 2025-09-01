import { User, Pool, Contribution, Message, ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  // Auth endpoints
  async guestLogin(name: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async googleLogin(token: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // User endpoints
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Pool endpoints
  async getPools(userId: string): Promise<ApiResponse<Pool[]>> {
    return this.request(`/pools?userId=${userId}`);
  }

  async getPool(poolId: string): Promise<ApiResponse<Pool>> {
    return this.request(`/pools/${poolId}`);
  }

  async createPool(poolData: Omit<Pool, 'id' | 'created_at' | 'current_amount'>): Promise<ApiResponse<Pool>> {
    return this.request('/pools', {
      method: 'POST',
      body: JSON.stringify(poolData),
    });
  }

  async joinPool(poolId: string, userId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/pools/${poolId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Contribution endpoints
  async getContributions(poolId: string): Promise<ApiResponse<Contribution[]>> {
    return this.request(`/pools/${poolId}/contributions`);
  }

  async addContribution(
    poolId: string, 
    contributionData: Omit<Contribution, 'id' | 'created_at'>
  ): Promise<ApiResponse<Contribution>> {
    return this.request(`/pools/${poolId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
  }

  // Message endpoints
  async getMessages(poolId: string): Promise<ApiResponse<Message[]>> {
    return this.request(`/pools/${poolId}/messages`);
  }

  async sendMessage(
    poolId: string, 
    messageData: Omit<Message, 'id' | 'created_at'>
  ): Promise<ApiResponse<Message>> {
    return this.request(`/pools/${poolId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Banking endpoints
  async getBankAccounts(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/banking/accounts?userId=${userId}`);
  }

  async linkBankAccount(userId: string, accountData: any): Promise<ApiResponse<any>> {
    return this.request('/banking/link', {
      method: 'POST',
      body: JSON.stringify({ userId, ...accountData }),
    });
  }

  // Gamification endpoints
  async getBadges(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/gamification/badges?userId=${userId}`);
  }

  async getLeaderboard(): Promise<ApiResponse<any[]>> {
    return this.request('/gamification/leaderboard');
  }

  async getStreaks(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/gamification/streaks?userId=${userId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
