// User Types
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
  current_streak?: number;
  total_saved?: number;
  avatar?: string;
  level?: number;
}

// Pool Types
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
  contribution_count?: number;
  owner_name?: string;
  contribution_streak?: number;
  is_public?: boolean;
  avatar_type?: string;
  avatar_data?: any;
  privacy_settings?: any;
}

export interface PoolMembership {
  id: string;
  pool_id: string;
  user_id: string;
  joined_at: string;
  role: 'admin' | 'member';
}

// Contribution Types
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

// Message Types
export interface Message {
  id: string;
  pool_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

// Transaction Types
export interface Transaction {
  id: number;
  type: 'contribution' | 'withdrawal' | 'penalty' | 'peer_transfer';
  amount: number;
  pool?: {
    name: string;
    destination: string;
  };
  timestamp: string;
  status: string;
  method?: string;
  reason?: string;
}

export type FilterType = 'all' | 'contributions' | 'withdrawals' | 'penalties';

// Banking Types
export interface BankAccount {
  id: string;
  user_id: string;
  plaid_account_id: string;
  account_name: string;
  account_type: string;
  balance: number;
  is_primary: boolean;
}

export interface VirtualCard {
  id: string;
  user_id: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  balance: number;
  is_active: boolean;
  spending_limit?: number;
}

// Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: 'contribution' | 'login' | 'goal_completion';
  current_count: number;
  best_count: number;
  last_activity: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface CreatePoolForm {
  name: string;
  description: string;
  goal_amount: number;
  target_date: string;
  pool_type: 'group' | 'solo';
  public_visibility: boolean;
}

export interface ContributionForm {
  amount: number;
  description?: string;
}

export interface ProfileForm {
  name: string;
  email: string;
  avatar_type: 'photo' | 'avatar';
  avatar_data?: string;
  profile_image_url?: string;
}
