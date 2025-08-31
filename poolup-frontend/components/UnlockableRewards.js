import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, Polygon } from 'react-native-svg';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

const radius = { sm: 8, md: 12, lg: 16 };

export default function UnlockableRewards({ 
  userId, 
  poolId, 
  userProgress,
  visible,
  onClose 
}) {
  const [unlockedRewards, setUnlockedRewards] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);

  const rewardTiers = [
    {
      id: 'starter_pack',
      name: 'Starter Pack',
      description: 'Welcome rewards for new savers',
      emoji: '🎁',
      requirement: { type: 'contributions', value: 1 },
      rewards: ['🎨 Basic Themes', '⭐ 100 Bonus Points', '🏷️ Newbie Badge'],
      tier: 'bronze'
    },
    {
      id: 'consistency_master',
      name: 'Consistency Master',
      description: 'Rewards for maintaining streaks',
      emoji: '🔥',
      requirement: { type: 'streak', value: 7 },
      rewards: ['🛡️ Streak Protection', '🎯 Precision Badge', '💰 2x Points Multiplier'],
      tier: 'silver'
    },
    {
      id: 'savings_champion',
      name: 'Savings Champion',
      description: 'Elite rewards for top savers',
      emoji: '👑',
      requirement: { type: 'total_saved', value: 100000 },
      rewards: ['✨ Premium Themes', '🏆 Champion Badge', '🎰 Exclusive Mini-Games'],
      tier: 'gold'
    },
    {
      id: 'goal_crusher',
      name: 'Goal Crusher',
      description: 'Rewards for completing goals',
      emoji: '💎',
      requirement: { type: 'goals_completed', value: 3 },
      rewards: ['💎 Diamond Themes', '🌟 Legend Badge', '🎪 Special Events Access'],
      tier: 'diamond'
    },
    {
      id: 'community_hero',
      name: 'Community Hero',
      description: 'Rewards for helping others',
      emoji: '🤝',
      requirement: { type: 'peer_boosts', value: 10 },
      rewards: ['🤝 Helper Themes', '💝 Altruist Badge', '🎊 Community Perks'],
      tier: 'platinum'
    }
  ];

  const visualThemeRewards = [
    {
      id: 'neon_city',
      name: 'Neon City',
      description: 'Futuristic cyberpunk savings visualization',
      emoji: '🌃',
      colors: ['#FF00FF', '#00FFFF', '#FFFF00'],
      unlockRequirement: { type: 'streak', value: 14 }
    },
    {
      id: 'space_odyssey',
      name: 'Space Odyssey',
      description: 'Cosmic journey to your financial goals',
      emoji: '🚀',
      colors: ['#4B0082', '#8A2BE2', '#9400D3'],
      unlockRequirement: { type: 'total_saved', value: 50000 }
    },
    {
      id: 'enchanted_forest',
      name: 'Enchanted Forest',
      description: 'Magical woodland savings adventure',
      emoji: '🧚‍♀️',
      colors: ['#228B22', '#32CD32', '#90EE90'],
      unlockRequirement: { type: 'goals_completed', value: 1 }
    },
    {
      id: 'pirate_treasure',
      name: 'Pirate Treasure',
      description: 'Ahoy! Collect doubloons for your treasure chest',
      emoji: '🏴‍☠️',
      colors: ['#8B4513', '#DAA520', '#FFD700'],
      unlockRequirement: { type: 'contributions', value: 25 }
    }
  ];

  useEffect(() => {
    checkUnlockedRewards();
  }, [userProgress]);

  const checkUnlockedRewards = () => {
    const unlocked = [];
    const available = [];

    rewardTiers.forEach(tier => {
      const isUnlocked = checkRequirement(tier.requirement, userProgress);
      if (isUnlocked) {
        unlocked.push(tier);
      } else {
        available.push(tier);
      }
    });

    setUnlockedRewards(unlocked);
    setAvailableRewards(available);
  };

  const checkRequirement = (requirement, progress) => {
    switch (requirement.type) {
      case 'contributions':
        return (progress.totalContributions || 0) >= requirement.value;
      case 'streak':
        return (progress.currentStreak || 0) >= requirement.value;
      case 'total_saved':
        return (progress.totalSaved || 0) >= requirement.value;
      case 'goals_completed':
        return (progress.goalsCompleted || 0) >= requirement.value;
      case 'peer_boosts':
        return (progress.peerBoosts || 0) >= requirement.value;
      default:
        return false;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return ['#CD7F32', '#B8860B'];
      case 'silver': return ['#C0C0C0', '#A9A9A9'];
      case 'gold': return ['#FFD700', '#FFA500'];
      case 'diamond': return ['#B9F2FF', '#87CEEB'];
      case 'platinum': return ['#E5E4E2', '#BCC6CC'];
      default: return [colors.primary, colors.secondary];
    }
  };

  const getProgressPercentage = (requirement, progress) => {
    const current = progress[requirement.type] || 0;
    return Math.min((current / requirement.value) * 100, 100);
  };

  const renderRewardTier = (tier, isUnlocked) => (
    <TouchableOpacity
      key={tier.id}
      style={[
        styles.rewardCard,
        !isUnlocked && styles.lockedRewardCard
      ]}
      onPress={() => setSelectedReward(tier)}
    >
      <LinearGradient
        colors={isUnlocked ? getTierColor(tier.tier) : ['#CCCCCC', '#999999']}
        style={styles.rewardGradient}
      >
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardEmoji}>{tier.emoji}</Text>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName}>{tier.name}</Text>
            <Text style={styles.rewardDescription}>{tier.description}</Text>
          </View>
          {isUnlocked && (
            <Text style={styles.unlockedBadge}>✅</Text>
          )}
        </View>
        
        {!isUnlocked && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progress: {getProgressPercentage(tier.requirement, userProgress).toFixed(0)}%
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProgressPercentage(tier.requirement, userProgress)}%` }
                ]} 
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderThemePreview = (theme) => (
    <View key={theme.id} style={styles.themePreview}>
      <LinearGradient
        colors={theme.colors}
        style={styles.themeGradient}
      >
        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
      </LinearGradient>
      <Text style={styles.themeName}>{theme.name}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Unlockable Rewards</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Unlocked Rewards</Text>
            {unlockedRewards.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyText}>No rewards unlocked yet</Text>
                <Text style={styles.emptySubtext}>Keep saving to unlock amazing rewards!</Text>
              </View>
            ) : (
              unlockedRewards.map(tier => renderRewardTier(tier, true))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Available Rewards</Text>
            {availableRewards.map(tier => renderRewardTier(tier, false))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Unlockable Themes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {visualThemeRewards.map(renderThemePreview)}
            </ScrollView>
          </View>
        </ScrollView>

        {selectedReward && (
          <RewardDetailModal
            reward={selectedReward}
            visible={!!selectedReward}
            onClose={() => setSelectedReward(null)}
            isUnlocked={unlockedRewards.some(r => r.id === selectedReward.id)}
          />
        )}
      </View>
    </Modal>
  );
}

function RewardDetailModal({ reward, visible, onClose, isUnlocked }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.rewardModal}>
          <LinearGradient
            colors={isUnlocked ? getTierColor(reward.tier) : ['#CCCCCC', '#999999']}
            style={styles.modalGradient}
          >
            <Text style={styles.modalEmoji}>{reward.emoji}</Text>
            <Text style={styles.modalTitle}>{reward.name}</Text>
            <Text style={styles.modalDescription}>{reward.description}</Text>
            
            <View style={styles.rewardsList}>
              <Text style={styles.rewardsTitle}>Includes:</Text>
              {reward.rewards.map((rewardItem, index) => (
                <Text key={index} style={styles.rewardItem}>• {rewardItem}</Text>
              ))}
            </View>
            
            {isUnlocked ? (
              <View style={styles.unlockedStatus}>
                <Text style={styles.unlockedText}>🎉 Unlocked!</Text>
                <Text style={styles.unlockedSubtext}>These rewards are now active</Text>
              </View>
            ) : (
              <View style={styles.lockedStatus}>
                <Text style={styles.lockedText}>🔒 Locked</Text>
                <Text style={styles.requirementText}>
                  Requirement: {getRequirementText(reward.requirement)}
                </Text>
              </View>
            )}
          </LinearGradient>
          
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getTierColor = (tier) => {
  switch (tier) {
    case 'bronze': return ['#CD7F32', '#B8860B'];
    case 'silver': return ['#C0C0C0', '#A9A9A9'];
    case 'gold': return ['#FFD700', '#FFA500'];
    case 'diamond': return ['#B9F2FF', '#87CEEB'];
    case 'platinum': return ['#E5E4E2', '#BCC6CC'];
    default: return [colors.primary, colors.secondary];
  }
};

const getRequirementText = (requirement) => {
  switch (requirement.type) {
    case 'contributions':
      return `${requirement.value} contributions`;
    case 'streak':
      return `${requirement.value} day streak`;
    case 'total_saved':
      return `$${requirement.value} saved`;
    case 'goals_completed':
      return `${requirement.value} goals completed`;
    case 'peer_boosts':
      return `${requirement.value} peer boosts`;
    default:
      return 'Unknown requirement';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  rewardCard: {
    marginBottom: 16,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  lockedRewardCard: {
    opacity: 0.8,
  },
  rewardGradient: {
    padding: 20,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  unlockedBadge: {
    fontSize: 24,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  themePreview: {
    alignItems: 'center',
    marginRight: 16,
  },
  themeGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeEmoji: {
    fontSize: 24,
  },
  themeName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 80,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModal: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardsList: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  rewardItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  unlockedStatus: {
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  unlockedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  lockedStatus: {
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeModalButton: {
    backgroundColor: colors.textSecondary,
    padding: 16,
    alignItems: 'center',
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
