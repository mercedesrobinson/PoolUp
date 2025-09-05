interface PremiumTier {
  name: string;
  price: number;
  pools_limit: number;
  members_per_pool: number;
  interest_rate: number;
  withdrawal_fees: boolean;
  features: string[];
}

interface OptimalContribution {
  daily_per_member: number;
  weekly_per_member: number;
  success_probability: number;
}

interface UpsellTrigger {
  type: string;
  message: string;
  cta: string;
  tier: string;
  urgency: 'low' | 'medium' | 'high';
}

interface UserUsage {
  pools_created: number;
  total_members: number;
  monthly_withdrawals: number;
  premium_features_used: string[];
}

interface User {
  tier: string;
  [key: string]: any;
}

// Premium subscription system for PoolUp
const PREMIUM_TIERS: Record<string, PremiumTier> = {
  FREE: {
    name: 'Free',
    price: 0,
    pools_limit: 3,
    members_per_pool: 5,
    interest_rate: 0.02, // 2% APY
    withdrawal_fees: true,
    features: ['basic_pools', 'basic_chat', 'basic_badges']
  },
  PLUS: {
    name: 'PoolUp Plus',
    price: 4.99,
    pools_limit: 10,
    members_per_pool: 15,
    interest_rate: 0.025, // 2.5% APY
    withdrawal_fees: false,
    features: ['premium_themes', 'advanced_badges', 'priority_support', 'no_fees']
  },
  PRO: {
    name: 'PoolUp Pro',
    price: 9.99,
    pools_limit: -1, // unlimited
    members_per_pool: 50,
    interest_rate: 0.03, // 3% APY
    withdrawal_fees: false,
    features: ['unlimited_pools', 'analytics', 'api_access', 'white_label']
  }
};

// Revenue optimization
function calculateOptimalContribution(
  poolGoal: number, 
  currentAmount: number, 
  daysRemaining: number, 
  memberCount: number
): OptimalContribution {
  const remainingAmount = poolGoal - currentAmount;
  const dailyTarget = remainingAmount / daysRemaining;
  const perMemberDaily = dailyTarget / memberCount;
  
  return {
    daily_per_member: Math.ceil(perMemberDaily * 1.1), // 10% buffer
    weekly_per_member: Math.ceil(perMemberDaily * 7.7),
    success_probability: Math.min(95, Math.max(20, 100 - (perMemberDaily / 10)))
  };
}

// Premium upsell triggers
function getPremiumUpsells(user: User, usage: UserUsage): UpsellTrigger[] {
  const triggers: UpsellTrigger[] = [];
  
  if (usage.pools_created >= 3 && user.tier === 'FREE') {
    triggers.push({
      type: 'pools_limit',
      message: 'You\'ve reached your pool limit! Upgrade to create unlimited pools.',
      cta: 'Upgrade to Plus',
      tier: 'PLUS',
      urgency: 'high'
    });
  }
  
  if (usage.total_members >= 25 && user.tier === 'FREE') {
    triggers.push({
      type: 'members_limit',
      message: 'Growing fast! Upgrade to invite more friends to your pools.',
      cta: 'Upgrade to Plus',
      tier: 'PLUS',
      urgency: 'medium'
    });
  }
  
  if (usage.monthly_withdrawals >= 2 && user.tier === 'FREE') {
    triggers.push({
      type: 'withdrawal_fees',
      message: 'Save on withdrawal fees with PoolUp Plus!',
      cta: 'Go Fee-Free',
      tier: 'PLUS',
      urgency: 'medium'
    });
  }
  
  if (usage.premium_features_used.length > 0 && user.tier === 'FREE') {
    triggers.push({
      type: 'premium_features',
      message: 'Unlock all premium features and boost your savings!',
      cta: 'Upgrade Now',
      tier: 'PLUS',
      urgency: 'low'
    });
  }
  
  return triggers;
}

// Check if user can access feature
function canAccessFeature(userTier: string, feature: string): boolean {
  const tier = PREMIUM_TIERS[userTier];
  if (!tier) return false;
  
  return tier.features.includes(feature);
}

// Get tier limits
function getTierLimits(tierName: string): PremiumTier | null {
  return PREMIUM_TIERS[tierName] || null;
}

// Calculate subscription revenue
function calculateMonthlyRevenue(userCounts: Record<string, number>): number {
  let revenue = 0;
  
  Object.entries(userCounts).forEach(([tier, count]) => {
    const tierData = PREMIUM_TIERS[tier];
    if (tierData) {
      revenue += tierData.price * count;
    }
  });
  
  return revenue;
}

// Get upgrade path
function getUpgradePath(currentTier: string): string[] {
  const tiers = ['FREE', 'PLUS', 'PRO'];
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === -1) return [];
  
  return tiers.slice(currentIndex + 1);
}

export {
  PREMIUM_TIERS,
  calculateOptimalContribution,
  getPremiumUpsells,
  canAccessFeature,
  getTierLimits,
  calculateMonthlyRevenue,
  getUpgradePath
};

export type {
  PremiumTier,
  OptimalContribution,
  UpsellTrigger,
  UserUsage
};
