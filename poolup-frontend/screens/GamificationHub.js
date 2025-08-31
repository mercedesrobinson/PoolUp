import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressVisualization from '../components/ProgressVisualization';
import BadgeSystem from '../components/BadgeSystem';
import StreakDisplay from '../components/StreakDisplay';
import Leaderboard from '../components/Leaderboard';
import ShareableMilestoneCard from '../components/ShareableMilestoneCard';
import AccountabilityDashboard from '../components/AccountabilityDashboard';
import PoolTemplateSelector from '../components/PoolTemplateSelector';
import MiniGameCenter from '../components/MiniGameCenter';
import UnlockableRewards from '../components/UnlockableRewards';
import CelebrationEffects, { quickCelebrations } from '../components/CelebrationEffects';

const { width } = Dimensions.get('window');

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

export default function GamificationHub({ navigation, route }) {
  const [activeFeature, setActiveFeature] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  
  const userId = route.params?.userId || 'guest';
  const poolId = route.params?.poolId || 1;

  const mockUserProgress = {
    currentStreak: 7,
    totalContributions: 15,
    totalSaved: 3500,
    goalsCompleted: 2,
    peerBoosts: 5,
    points: 1250
  };

  const mockPoolData = {
    id: poolId,
    name: 'Dream Vacation Fund',
    goal_cents: 500000,
    saved_cents: 175000,
    visual_theme: 'beach_vacation',
    members: 4
  };

  const features = [
    {
      id: 'progress_viz',
      title: 'Visual Progress',
      emoji: '📊',
      description: 'Animated themed progress tracking',
      component: 'ProgressVisualization',
      color: colors.primary
    },
    {
      id: 'badges',
      title: 'Badge System',
      emoji: '🏆',
      description: 'Earn badges for achievements',
      component: 'BadgeSystem',
      color: colors.warning
    },
    {
      id: 'streaks',
      title: 'Streak Tracking',
      emoji: '🔥',
      description: 'Maintain consistency streaks',
      component: 'StreakDisplay',
      color: colors.error
    },
    {
      id: 'leaderboards',
      title: 'Leaderboards',
      emoji: '🥇',
      description: 'Compete with other savers',
      component: 'Leaderboard',
      color: colors.success
    },
    {
      id: 'milestone_cards',
      title: 'Milestone Cards',
      emoji: '📱',
      description: 'Share achievements on social media',
      component: 'ShareableMilestoneCard',
      color: colors.secondary
    },
    {
      id: 'accountability',
      title: 'Accountability',
      emoji: '⚖️',
      description: 'Forfeit system and peer boosts',
      component: 'AccountabilityDashboard',
      color: '#FF6B6B'
    },
    {
      id: 'templates',
      title: 'Pool Templates',
      emoji: '📋',
      description: 'Pre-built savings goals',
      component: 'PoolTemplateSelector',
      color: '#4ECDC4'
    },
    {
      id: 'mini_games',
      title: 'Mini Games',
      emoji: '🎮',
      description: 'Play games, earn rewards',
      component: 'MiniGameCenter',
      color: '#45B7D1'
    },
    {
      id: 'rewards',
      title: 'Unlockable Rewards',
      emoji: '🎁',
      description: 'Tier-based reward progression',
      component: 'UnlockableRewards',
      color: '#96CEB4'
    }
  ];

  const triggerCelebration = (type, data) => {
    setCelebrationData({ type, data });
    setShowCelebration(true);
  };

  const renderFeatureCard = (feature) => (
    <TouchableOpacity
      key={feature.id}
      style={styles.featureCard}
      onPress={() => setActiveFeature(feature)}
    >
      <LinearGradient
        colors={[feature.color, feature.color + '80']}
        style={styles.featureGradient}
      >
        <Text style={styles.featureEmoji}>{feature.emoji}</Text>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderActiveFeature = () => {
    if (!activeFeature) return null;

    const commonProps = {
      userId,
      poolId,
      userProgress: mockUserProgress,
      poolData: mockPoolData,
      visible: true,
      onClose: () => setActiveFeature(null)
    };

    switch (activeFeature.component) {
      case 'ProgressVisualization':
        return (
          <View style={styles.featureDemo}>
            <ProgressVisualization
              progress={35}
              theme={mockPoolData.visual_theme}
              goalAmount={5000}
              savedAmount={1750}
            />
          </View>
        );
      case 'BadgeSystem':
        return <BadgeSystem {...commonProps} />;
      case 'StreakDisplay':
        return (
          <View style={styles.featureDemo}>
            <StreakDisplay
              streak={mockUserProgress.currentStreak}
              onStreakPress={() => triggerCelebration('streak', { streakCount: 7 })}
            />
          </View>
        );
      case 'Leaderboard':
        return <Leaderboard {...commonProps} />;
      case 'ShareableMilestoneCard':
        return (
          <ShareableMilestoneCard
            {...commonProps}
            milestone={{
              percentage: 35,
              amount: 1750,
              goal: 5000,
              poolName: mockPoolData.name,
              theme: mockPoolData.visual_theme
            }}
          />
        );
      case 'AccountabilityDashboard':
        return <AccountabilityDashboard {...commonProps} />;
      case 'PoolTemplateSelector':
        return <PoolTemplateSelector {...commonProps} />;
      case 'MiniGameCenter':
        return (
          <MiniGameCenter
            {...commonProps}
            onGameComplete={(gameType, reward) => 
              triggerCelebration('badge', { 
                badgeName: `${gameType} Winner!`, 
                points: reward.points 
              })
            }
          />
        );
      case 'UnlockableRewards':
        return <UnlockableRewards {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🎮 Gamification Hub</Text>
        <Text style={styles.headerSubtitle}>
          Explore all PoolUp's engagement features
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.statsOverview}>
          <Text style={styles.statsTitle}>Your Progress Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{mockUserProgress.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>${mockUserProgress.totalSaved}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{mockUserProgress.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statValue}>{mockUserProgress.goalsCompleted}</Text>
              <Text style={styles.statLabel}>Goals Done</Text>
            </View>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🚀 Gamification Features</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any feature to see it in action
          </Text>
          
          <View style={styles.featuresGrid}>
            {features.map(renderFeatureCard)}
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => triggerCelebration('badge', { 
                badgeName: 'Demo Badge', 
                badgeDescription: 'Testing celebration effects!',
                points: 100 
              })}
            >
              <Text style={styles.actionButtonText}>🎉 Test Celebration</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              onPress={() => navigation.navigate('MiniGames', { userId })}
            >
              <Text style={styles.actionButtonText}>🎮 Play Games</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate('Badges', { userId })}
            >
              <Text style={styles.actionButtonText}>🏆 View Badges</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderActiveFeature()}

      <CelebrationEffects
        visible={showCelebration}
        achievementType={celebrationData?.type}
        achievementData={celebrationData?.data}
        onComplete={() => setShowCelebration(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsOverview: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featureDemo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  quickActions: {
    marginBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
