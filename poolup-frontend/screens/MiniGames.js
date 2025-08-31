import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MiniGameCenter from '../components/MiniGameCenter';
import UnlockableRewards from '../components/UnlockableRewards';
import CelebrationEffects, { quickCelebrations } from '../components/CelebrationEffects';

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF'
};

export default function MiniGames({ navigation, route }) {
  const [userProgress, setUserProgress] = useState({
    currentStreak: 5,
    totalContributions: 12,
    totalSaved: 2500,
    goalsCompleted: 1,
    peerBoosts: 3,
    points: 850
  });
  
  const [showRewards, setShowRewards] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  const handleGameReward = (gameType, reward) => {
    // Update user progress
    setUserProgress(prev => ({
      ...prev,
      points: prev.points + (reward.points || 0)
    }));

    // Show celebration
    const celebration = quickCelebrations.badgeEarned(
      `${gameType} Winner!`,
      `You earned ${reward.points} points!`,
      reward.points
    );
    
    setCelebrationData(celebration);
    setShowCelebration(true);
  };

  const gameStats = [
    {
      title: 'Games Played',
      value: '23',
      emoji: '🎮',
      color: colors.primary
    },
    {
      title: 'Points Earned',
      value: userProgress.points.toLocaleString(),
      emoji: '⭐',
      color: colors.warning
    },
    {
      title: 'Streak Bonus',
      value: `${userProgress.currentStreak}x`,
      emoji: '🔥',
      color: colors.success
    },
    {
      title: 'Rewards Unlocked',
      value: '7',
      emoji: '🏆',
      color: colors.secondary
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🎮 Mini Games</Text>
        <Text style={styles.headerSubtitle}>Play games, earn rewards, have fun!</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          {gameStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Available Games</Text>
            <TouchableOpacity 
              style={styles.rewardsButton}
              onPress={() => setShowRewards(true)}
            >
              <Text style={styles.rewardsButtonText}>🏆 Rewards</Text>
            </TouchableOpacity>
          </View>
          
          <MiniGameCenter 
            userId={route.params?.userId || 'guest'}
            userProgress={userProgress}
            onGameComplete={handleGameReward}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎊 Recent Achievements</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🏆</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>Streak Master</Text>
                <Text style={styles.achievementDesc}>5 day saving streak!</Text>
              </View>
              <Text style={styles.achievementPoints}>+50 pts</Text>
            </View>
            
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🎰</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>Lucky Spinner</Text>
                <Text style={styles.achievementDesc}>Won bonus points!</Text>
              </View>
              <Text style={styles.achievementPoints}>+25 pts</Text>
            </View>
            
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🎯</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>Goal Crusher</Text>
                <Text style={styles.achievementDesc}>Smashed your target!</Text>
              </View>
              <Text style={styles.achievementPoints}>+100 pts</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Gaming Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridEmoji}>🎮</Text>
              <Text style={styles.statGridValue}>23</Text>
              <Text style={styles.statGridLabel}>Games Played</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridEmoji}>🏆</Text>
              <Text style={styles.statGridValue}>12</Text>
              <Text style={styles.statGridLabel}>Games Won</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridEmoji}>🎯</Text>
              <Text style={styles.statGridValue}>52%</Text>
              <Text style={styles.statGridLabel}>Win Rate</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridEmoji}>⚡</Text>
              <Text style={styles.statGridValue}>3</Text>
              <Text style={styles.statGridLabel}>Win Streak</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <UnlockableRewards
        userId={route.params?.userId || 'guest'}
        userProgress={userProgress}
        visible={showRewards}
        onClose={() => setShowRewards(false)}
      />

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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  rewardsButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rewardsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statGridItem: {
    backgroundColor: colors.card,
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statGridEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statGridValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statGridLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
