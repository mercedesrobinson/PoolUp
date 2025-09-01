// API Types for PoolUp App

export interface User {
  id: string;
  name: string;
  email?: string;
  google_id?: string;
  avatar_type?: 'default' | 'custom' | 'photo';
  avatar_data?: any;
  profile_image_url?: string;
  created_at: string;
}

export interface Pool {
  id: string;
  name: string;
  description?: string;
  goal_amount_cents: number;
  current_amount_cents: number;
  target_date: string;
  created_by: string;
  pool_type: 'group' | 'solo';
  is_public: boolean;
  created_at: string;
  destination?: string;
  purpose?: string;
}

export interface Contribution {
  id: string;
  pool_id: string;
  user_id: string;
  amount_cents: number;
  payment_method?: string;
  payment_token?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'venmo' | 'cashapp' | 'paypal' | 'bank';
  method_data: any;
  is_verified: boolean;
  created_at: string;
}

export interface PeerTransfer {
  id: string;
  pool_id: string;
  from_user_id: string;
  to_user_id: string;
  amount_cents: number;
  message?: string;
  created_at: string;
}

export interface DebitCard {
  id: string;
  user_id: string;
  last_four: string;
  balance_cents: number;
  status: 'active' | 'frozen' | 'cancelled';
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at?: string;
}

export interface Activity {
  id: string;
  type: 'contribution' | 'milestone' | 'streak' | 'pool_created';
  user: {
    name: string;
    avatar: string;
  };
  pool?: {
    name: string;
    destination?: string;
  };
  amount?: number;
  milestone?: number;
  streakDays?: number;
  timestamp: string;
  isPublic: boolean;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  website: string;
  category: string;
  icon: string;
  color: string;
}

export interface PenaltySettings {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  amount: number;
  destination: 'pool' | 'charity' | 'forfeit';
  charity?: string;
}

export interface PaydaySettings {
  frequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  days: string[];
  dates: number[];
}

export interface RecurringPayment {
  enabled: boolean;
  amount: number;
  payment_method: string;
  frequency: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
