export interface User {
  id: string;
  email: string;
  name: string;
  avatar_type?: 'photo' | 'avatar';
  avatar_data?: string;
  profile_image_url?: string;
  google_id?: string;
  authProvider?: string;
  created_at: string;
}

export interface Pool {
  id: string;
  name: string;
  description: string;
  goal_amount: number;
  goal_cents: number;
  current_amount: number;
  saved_cents: number;
  target_date: string;
  trip_date?: string;
  destination?: string;
  created_by: string;
  pool_type: 'group' | 'solo';
  public_visibility: boolean;
  created_at: string;
  member_count?: number;
  members?: User[];
  progress_percentage?: number;
  bonus_pot_cents?: number;
  contributions?: Contribution[];
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
  amount_cents: number;
  description?: string;
  created_at: string;
  points_earned?: number;
  streak_bonus?: number;
  user?: User;
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
