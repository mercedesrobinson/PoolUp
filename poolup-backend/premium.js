// Premium subscription system for PoolUp
const PREMIUM_TIERS = {
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
function calculateOptimalContribution(poolGoal, currentAmount, daysRemaining, memberCount) {
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
function getPremiumUpsells(user, usage) {
  const triggers = [];
  
  if (usage.pools_created >= 3 && user.tier === 'FREE') {
    triggers.push({
      type: 'pools_limit',
      message: 'Upgrade to PoolUp Plus for 10 pools + higher interest rates!',
      tier_suggested: 'PLUS'
    });
  }
  
  if (usage.monthly_contributions > 500 && user.tier !== 'PRO') {
    triggers.push({
      type: 'high_saver',
      message: 'Earn 3% APY with PoolUp Pro - perfect for serious savers!',
      tier_suggested: 'PRO'
    });
  }
  
  return triggers;
}

// Revenue analytics
function calculateRevenue(users) {
  let subscriptionRevenue = 0;
  let floatRevenue = 0;
  let transactionFees = 0;
  
  users.forEach(user => {
    const tier = PREMIUM_TIERS[user.tier] || PREMIUM_TIERS.FREE;
    subscriptionRevenue += tier.price;
    
    // Float revenue (2.5% spread on pooled funds)
    const userBalance = user.total_pooled_amount || 0;
    floatRevenue += (userBalance * 0.025) / 12; // Monthly
    
    // Transaction fees for free tier
    if (user.tier === 'FREE' && user.monthly_withdrawals > 0) {
      transactionFees += user.monthly_withdrawals * 2.99;
    }
  });
  
  return {
    subscription_revenue: subscriptionRevenue,
    float_revenue: floatRevenue,
    transaction_fees: transactionFees,
    total_revenue: subscriptionRevenue + floatRevenue + transactionFees
  };
}

module.exports = {
  PREMIUM_TIERS,
  calculateOptimalContribution,
  getPremiumUpsells,
  calculateRevenue
};
