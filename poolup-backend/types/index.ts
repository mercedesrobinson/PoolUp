import { Request, Response } from 'express';

// Database Models
export interface User {
  id: number;
  name: string;
  email?: string;
  google_id?: string;
  avatar_type?: 'default' | 'custom' | 'photo';
  avatar_data?: any;
  profile_image_url?: string;
  created_at: string;
  xp?: number;
  total_points?: number;
  current_streak?: number;
  badge_count?: number;
}

export interface Pool {
  id: number;
  name: string;
  description?: string;
  goal_amount_cents: number;
  current_amount_cents: number;
  target_date: string;
  created_by: number;
  pool_type: 'group' | 'solo';
  is_public: boolean;
  created_at: string;
  destination?: string;
  purpose?: string;
}

export interface Contribution {
  id: number;
  pool_id: number;
  user_id: number;
  amount_cents: number;
  payment_method?: string;
  payment_token?: string;
  created_at: string;
}

export interface Message {
  id: number;
  pool_id: number;
  user_id: number;
  body: string;
  created_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at?: string;
}

export interface DebitCard {
  id: string;
  user_id: number;
  last_four: string;
  balance_cents: number;
  status: 'active' | 'frozen' | 'cancelled';
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  user_id: number;
  method_type: 'venmo' | 'cashapp' | 'paypal' | 'bank';
  method_data: any;
  is_verified: boolean;
  created_at: string;
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export interface CreatePoolRequest {
  userId: string;
  name: string;
  goalCents: number;
  destination: string;
  tripDate: string;
  poolType: 'group' | 'solo';
  penalty?: any;
}

export interface ContributeRequest {
  userId: string;
  amountCents: number;
  paymentMethod: string;
  paymentToken?: string;
}

export interface SendMessageRequest {
  userId: string;
  body: string;
}

// Database Connection
export interface Database {
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;
  exec(sql: string): Promise<void>;
}

// Socket.IO Types
export interface SocketData {
  userId?: string;
  poolId?: string;
}

// Gamification Types
export interface UserStats {
  xp: number;
  total_points: number;
  current_streak: number;
  badge_count: number;
}

export interface Challenge {
  id: number;
  pool_id: number;
  name: string;
  description: string;
  target_amount_cents: number;
  deadline: string;
  reward_points: number;
  is_active: boolean;
}

// Banking Types
export interface BankAccount {
  id: string;
  user_id: number;
  plaid_item_id: string;
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  balance_cents: number;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  card_id: string;
  amount_cents: number;
  merchant: string;
  category: string;
  cashback_cents: number;
  points_earned: number;
  created_at: string;
}
