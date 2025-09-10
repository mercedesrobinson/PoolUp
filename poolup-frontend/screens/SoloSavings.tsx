import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { api } from '../services/api';

export default function SoloSavings({ route, navigation }) {
  const { userId } = route?.params || {};
  const [publicPools, setPublicPools] = useState([
    {
      id: 1,
      name: "Emergency Fund Goal",
      goal_cents: 100000,
      total_contributed_cents: 35000,
      owner_name: "Sarah M.",
      contribution_streak: 12,
      destination: "Emergency Fund",
      is_public: true,
      avatar_type: "emoji",
      avatar_data: null
    },
    {
      id: 2,
      name: "Vacation Fund",
      goal_cents: 200000,
      total_contributed_cents: 85000,
      owner_name: "Mike R.",
      contribution_streak: 8,
      destination: "Hawaii Trip",
      is_public: true,
      avatar_type: "emoji", 
      avatar_data: null
    }
  ]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([
    {
      id: 1,
      name: "Alex Chen",
      current_streak: 45,
      total_saved: 250000,
      avatar: "👨‍💻"
    },
    {
      id: 2,
      name: "Maria Garcia",
      current_streak: 32,
      total_saved: 180000,
      avatar: "👩‍🎨"
    }
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [friendsActivity, setFriendsActivity] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load real data from backend APIs
      const publicPoolsData = await api.getPublicSoloPools();
      setPublicPools(publicPoolsData || []);
      
      const leaderboardData = await api.getStreakLeaderboard();
      setStreakLeaderboard(leaderboardData || []);
      
      const friendsActivityData = await api.getFriendsFeed(userId, 'all');
      setFriendsActivity(friendsActivityData || []);
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
    navigation.navigate("CreatePool" as any, { userId, poolType: 'solo' });
  };

  const renderPoolCard = (pool) => {
    const progressPercent = Math.min((pool.total_contributed_cents / pool.goal_cents) * 100, 100);
    const privacy = pool.privacy_settings || {};
    
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
          <Text style={styles.destination}>
            🎯 {privacy.show_goal_purpose !== false ? (pool.destination || 'Personal Goal') : 'Private Goal'}
          </Text>
          {(privacy.show_current_amount !== false || privacy.show_goal_amount !== false) && (
            <Text style={styles.progress}>
              {privacy.show_current_amount !== false 
                ? `$${(pool.total_contributed_cents / 100).toFixed(2)}` 
                : '•••••'
              }
              {' / '}
              {privacy.show_goal_amount !== false 
                ? `$${(pool.goal_cents / 100).toFixed(2)}` 
                : '•••••'
              }
            </Text>
          )}
        </View>

        {privacy.show_progress_bar !== false && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}

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

  const renderActivityCard = (activity) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'contribution': return '💰';
        case 'milestone': return '🎯';
        case 'streak': return '🔥';
        case 'new_goal': return '🚀';
        default: return '💫';
      }
    };

    const getActivityColor = (type) => {
      switch (type) {
        case 'contribution': return '#34A853';
        case 'milestone': return '#FF6B35';
        case 'streak': return '#FF6B35';
        case 'new_goal': return '#4285F4';
        default: return '#666';
      }
    };

    return (
      <View key={activity.id} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityUserInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{activity.user_avatar}</Text>
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityUserName}>{activity.user_name}</Text>
              <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
            </View>
          </View>
          <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.action_type) }]}>
            <Text style={styles.activityIconText}>{getActivityIcon(activity.action_type)}</Text>
          </View>
        </View>

        <View style={styles.activityContent}>
          <Text style={styles.activityMessage}>{activity.message}</Text>
          {activity.pool_name && (
            <View style={[styles.poolTag, { 
              backgroundColor: activity.pool_type === 'solo' ? '#E8F0FE' : '#FFF3E0' 
            }]}>
              <Text style={[styles.poolTagText, { 
                color: activity.pool_type === 'solo' ? '#1A73E8' : '#F57C00' 
              }]}>
                {activity.pool_type === 'solo' ? '👤' : '👥'} {activity.pool_name}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderActivityFeed = () => {
    return (
      <View>
        {friendsActivity.map(renderActivityCard)}
        {friendsActivity.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Follow friends to see their savings activity here!
            </Text>
          </View>
        )}
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
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#FAFCFF' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={'#007AFF'}
        />
      }
    >
      {/* Header */}
      <View style={{ backgroundColor: '#4285F4', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Friends Feed</Text>
        <TouchableOpacity style={styles.createButton} onPress={createSoloPool}>
          <Text style={styles.createButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            All Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            My Groups
          </Text>
        </TouchableOpacity>
      </View>

      <View 
        style={styles.content}
      >
        {activeTab === 'discover' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Savings Activity</Text>
              <Text style={styles.sectionSubtitle}>
                Recent activity from friends and groups
              </Text>
            </View>
            {renderActivityFeed()}
          </View>
        ) : activeTab === 'friends' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friends' Goals</Text>
              <Text style={styles.sectionSubtitle}>
                Support your friends on their savings journey
              </Text>
            </View>
            {Array.isArray(publicPools) ? publicPools.map(renderPoolCard) : []}
            {(!publicPools || publicPools.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Add friends to see their savings goals here!
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Group Activity</Text>
              <Text style={styles.sectionSubtitle}>
                Activity from groups you're part of
              </Text>
            </View>
            {Array.isArray(streakLeaderboard) ? streakLeaderboard.map(renderLeaderboardCard) : []}
            {(!streakLeaderboard || streakLeaderboard.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Join groups to see activity here!
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
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityDetails: {
    marginLeft: 12,
    flex: 1,
  },
  activityUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    marginTop: 8,
  },
  activityMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  poolTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  poolTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
