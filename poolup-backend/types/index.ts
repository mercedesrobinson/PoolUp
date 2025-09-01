export interface User {
  id: string;
  email: string;
  name: string;
  avatar_type?: 'photo' | 'avatar';
  avatar_data?: string;
  profile_image_url?: string;
  google_id?: string;
  created_at: string;
}

export interface Pool {
  id: string;
  name: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  target_date: string;
  created_by: string;
  pool_type: 'group' | 'solo';
  public_visibility: boolean;
  created_at: string;
}

export interface PoolMembership {
  id: string;
  pool_id: string;
  user_id: string;
  joined_at: string;
  role: 'admin' | 'member';
}

export interface Contribution {
  id: string;
  pool_id: string;
  user_id: string;
  amount: number;
  description?: string;
  created_at: string;
}

export interface Message {
  id: string;
  pool_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest {
  name?: string;
  token?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
