import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { api } from '../services/api';

export default function SoloSavings({ route, navigation }) {
  const { userId } = route.params || {};
  const [publicPools, setPublicPools] = useState([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pools, streaks] = await Promise.all([
        api.getPublicSoloPools(20),
        api.getStreakLeaderboard(20)
      ]);
      setPublicPools(pools);
      setStreakLeaderboard(streaks);
    } catch (error) {
      console.error('Error loading solo savings data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const sendEncouragement = async (toUserId, poolId) => {
    const messages = [
      "You've got this! Keep saving! 💪",
      "Your consistency is inspiring! 🌟",
      "One step closer to your goal! 🎯",
      "Stay strong, you're doing amazing! 🔥",
      "Keep that streak alive! 🚀"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    try {
      await api.sendEncouragement(userId, toUserId, poolId, message, 'streak_support');
      Alert.alert('Sent!', 'Your encouragement has been sent! 🎉');
    } catch (error) {
      console.error('Error sending encouragement:', error);
      Alert.alert('Error', 'Failed to send encouragement');
    }
  };

  const createSoloPool = () => {
    navigation.navigate('CreatePool', { userId, poolType: 'solo' });
  };

  const renderPoolCard = (pool) => {
    const progressPercent = Math.min((pool.total_contributed_cents / pool.goal_cents) * 100, 100);
    
    return (
      <View key={pool.id} style={styles.poolCard}>
        <View style={styles.poolHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {pool.avatar_type === 'generated' && pool.avatar_data ? 
                  JSON.parse(pool.avatar_data).hairStyle?.emoji || '👤' : '👤'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{pool.owner_name}</Text>
              <Text style={styles.poolName}>{pool.name}</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {pool.contribution_streak}</Text>
          </View>
        </View>

        <View style={styles.goalInfo}>
          <Text style={styles.destination}>🎯 {pool.destination || 'Personal Goal'}</Text>
          <Text style={styles.progress}>
            ${(pool.total_contributed_cents / 100).toFixed(2)} / ${(pool.goal_cents / 100).toFixed(2)}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.poolActions}>
          <TouchableOpacity 
            style={styles.encourageButton}
            onPress={() => sendEncouragement(pool.owner_id, pool.id)}
          >
            <Text style={styles.encourageButtonText}>💪 Encourage</Text>
          </TouchableOpacity>
          <Text style={styles.contributionCount}>
            {pool.contribution_count} contributions
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardCard = (user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    
    return (
      <View key={user.id} style={styles.leaderboardCard}>
        <View style={styles.leaderboardRank}>
          <Text style={styles.rankText}>{medal}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.avatar_type === 'generated' && user.avatar_data ? 
              JSON.parse(user.avatar_data).hairStyle?.emoji || '👤' : '👤'}
          </Text>
        </View>
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>{user.name}</Text>
          <Text style={styles.leaderboardStats}>
            Level {user.level} • {user.solo_pools_count} pools
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {user.current_streak}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#4285F4', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Solo Savings</Text>
        <TouchableOpacity style={styles.createButton} onPress={createSoloPool}>
          <Text style={styles.createButtonText}>+ Solo Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Streaks
          </Text>
        </TouchableOpacity>
      </View>

      <View 
        style={styles.content}
      >
        {activeTab === 'discover' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Public Solo Goals</Text>
              <Text style={styles.sectionSubtitle}>
                Support others on their savings journey
              </Text>
            </View>
            {publicPools.map(renderPoolCard)}
            {publicPools.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No public solo goals yet. Be the first to create one!
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Streak Leaderboard</Text>
              <Text style={styles.sectionSubtitle}>
                Top consistent savers
              </Text>
            </View>
            {streakLeaderboard.map(renderLeaderboardCard)}
            {streakLeaderboard.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Start saving to appear on the leaderboard!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  poolCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  poolName: {
    fontSize: 14,
    color: '#666',
  },
  streakBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  streakText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  goalInfo: {
    marginBottom: 10,
  },
  destination: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  progress: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34A853',
    borderRadius: 4,
  },
  poolActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encourageButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  encourageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contributionCount: {
    fontSize: 12,
    color: '#666',
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  leaderboardStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
