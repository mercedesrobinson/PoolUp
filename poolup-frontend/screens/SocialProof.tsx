import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

const SocialProof = ({ navigation, route }) => {
  const { user } = route?.params || {};
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const [socialData, setSocialData] = useState({
    communityStats: {
      totalUsers: 0,
      totalSaved: 0,
      goalsCompleted: 0,
      averageSuccess: 0
    },
    successStories: [],
    recentAchievements: [],
    leaderboard: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialProofData();
  }, []);

  const loadSocialProofData = async () => {
    try {
      setLoading(true);
      
      // Mock data for social proof - in real app, this would come from API
      const mockData = {
        communityStats: {
          totalUsers: 12847,
          totalSaved: 2847392,
          goalsCompleted: 3421,
          averageSuccess: 78
        },
        successStories: [
          {
            id: 1,
            name: 'Sarah M.',
            avatar: '👩‍💼',
            goal: 'Emergency Fund',
            amount: 5000,
            timeframe: '8 months',
            story: 'Started with $50/week and built my emergency fund faster than I thought possible!'
          },
          {
            id: 2,
            name: 'Mike R.',
            avatar: '👨‍🎓',
            goal: 'Dream Vacation',
            amount: 3500,
            timeframe: '6 months',
            story: 'The group accountability kept me motivated. Just booked my trip to Japan!'
          },
          {
            id: 3,
            name: 'Lisa K.',
            avatar: '👩‍🚀',
            goal: 'New Car',
            amount: 8000,
            timeframe: '12 months',
            story: 'Saved for my first car while in college. PoolUp made it feel like a game!'
          }
        ],
        recentAchievements: [
          { user: 'Alex T.', achievement: 'Completed $2,000 vacation fund', time: '2 hours ago', emoji: '✈️' },
          { user: 'Emma S.', achievement: 'Hit 50-day saving streak', time: '5 hours ago', emoji: '🔥' },
          { user: 'David L.', achievement: 'Reached 75% of emergency fund', time: '1 day ago', emoji: '🎯' },
          { user: 'Maya P.', achievement: 'Joined first group savings pool', time: '1 day ago', emoji: '👥' },
          { user: 'Chris W.', achievement: 'Saved first $1,000', time: '2 days ago', emoji: '💰' }
        ],
        leaderboard: [
          { rank: 1, name: 'Jennifer L.', streak: 127, amount: 15420 },
          { rank: 2, name: 'Robert K.', streak: 98, amount: 12850 },
          { rank: 3, name: 'Amanda R.', streak: 89, amount: 11200 },
          { rank: 4, name: 'You', streak: user?.current_streak || 5, amount: 2450 },
          { rank: 5, name: 'Tyler M.', streak: 76, amount: 9800 }
        ]
      };
      
      setSocialData(mockData);
    } catch (error) {
      console.error('Failed to load social proof data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSocialProofData();
  };

  const CommunityStatsCard = () => (
    <LinearGradient
      colors={['#4CAF50', '#45A049']}
      style={styles.statsCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.statsTitle}>PoolUp Community</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{socialData.communityStats.totalUsers?.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Savers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>${(socialData.communityStats.totalSaved / 1000000).toFixed(1)}M</Text>
          <Text style={styles.statLabel}>Total Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{socialData.communityStats.goalsCompleted?.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Goals Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{socialData.communityStats.averageSuccess}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const SuccessStoryCard = ({ story }) => (
    <View style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <Text style={styles.storyAvatar}>{story.avatar}</Text>
        <View style={styles.storyInfo}>
          <Text style={styles.storyName}>{story.name}</Text>
          <Text style={styles.storyGoal}>{story.goal} • ${story.amount.toLocaleString()} in {story.timeframe}</Text>
        </View>
        <View style={styles.successBadge}>
          <Text style={styles.successBadgeText}>✓</Text>
        </View>
      </View>
      <Text style={styles.storyText}>"{story.story}"</Text>
    </View>
  );

  const AchievementItem = ({ achievement }) => (
    <View style={styles.achievementItem}>
      <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
      <View style={styles.achievementText}>
        <Text style={styles.achievementUser}>{achievement.user}</Text>
        <Text style={styles.achievementDescription}>{achievement.achievement}</Text>
      </View>
      <Text style={styles.achievementTime}>{achievement.time}</Text>
    </View>
  );

  const LeaderboardItem = ({ item }) => (
    <View style={[styles.leaderboardItem, item.name === 'You' && styles.currentUserItem]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, item.name === 'You' && styles.currentUserText]}>#{item.rank}</Text>
      </View>
      <View style={styles.leaderboardInfo}>
        <Text style={[styles.leaderboardName, item.name === 'You' && styles.currentUserText]}>
          {item.name}
        </Text>
        <Text style={styles.leaderboardStats}>
          {item.streak} day streak • ${item.amount.toLocaleString()} saved
        </Text>
      </View>
      {item.rank <= 3 && (
        <Text style={styles.medal}>
          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Community Success</Text>
        <Text style={styles.subtitle}>
          See how PoolUp is helping thousands achieve their financial goals
        </Text>
      </View>

      <View style={styles.section}>
        <CommunityStatsCard />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Success Stories</Text>
        {socialData.successStories.map((story) => (
          <SuccessStoryCard key={story.id} story={story} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Recent Achievements</Text>
        <View style={styles.achievementsList}>
          {socialData.recentAchievements.map((achievement, index) => (
            <AchievementItem key={index} achievement={achievement} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Community Leaderboard</Text>
        <View style={styles.leaderboardContainer}>
          {socialData.leaderboard.map((item) => (
            <LeaderboardItem key={item.rank} item={item} />
          ))}
        </View>
      </View>

      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.ctaCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.ctaTitle}>Ready to Join Them?</Text>
          <Text style={styles.ctaSubtitle}>
            Start your savings journey and become part of our success community
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('CreatePool')}
          >
            <Text style={styles.ctaButtonText}>Create Your First Goal</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={styles.shareSection}>
        <Text style={styles.sectionTitle}>📱 Share Your Success</Text>
        <Text style={styles.shareDescription}>
          When you achieve your goals, your story could inspire others just like these success stories inspired you.
        </Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => navigation.navigate("ProgressSharing" as any, { user })}
        >
          <Text style={styles.shareButtonText}>Share My Progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 25,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  storyCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  storyAvatar: {
    fontSize: 40,
    marginRight: 15,
  },
  storyInfo: {
    flex: 1,
  },
  storyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  storyGoal: {
    fontSize: 14,
    color: '#666666',
  },
  successBadge: {
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  storyText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  achievementsList: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  achievementText: {
    flex: 1,
  },
  achievementUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666666',
  },
  achievementTime: {
    fontSize: 12,
    color: '#999999',
  },
  leaderboardContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  currentUserItem: {
    backgroundColor: '#E8F5E8',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
  },
  currentUserText: {
    color: '#4CAF50',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  leaderboardStats: {
    fontSize: 14,
    color: '#666666',
  },
  medal: {
    fontSize: 24,
  },
  ctaSection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  ctaCard: {
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  shareSection: {
    backgroundColor: 'white',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  shareDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialProof;
