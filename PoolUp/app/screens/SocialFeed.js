import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert } from 'react-native';
import { api } from '../services/api';

export default function SocialFeed({ route, navigation }) {
  const { userId } = route.params;
  const [feed, setFeed] = useState([]);
  const [encouragements, setEncouragements] = useState([]);
  const [follows, setFollows] = useState({ followers: [], following: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [encouragementText, setEncouragementText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [feedData, encouragementData, followData] = await Promise.all([
        api.getActivityFeed(userId),
        api.getUserEncouragements(userId),
        api.getUserFollows(userId)
      ]);
      setFeed(feedData);
      setEncouragements(encouragementData);
      setFollows(followData);
    } catch (error) {
      console.error('Error loading social data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const sendQuickEncouragement = async (toUserId, poolId = null) => {
    const quickMessages = [
      "Keep it up! 🌟",
      "You're crushing it! 💪",
      "So proud of your progress! 🎉",
      "Stay consistent! 🔥",
      "Almost there! 🎯"
    ];
    
    const message = quickMessages[Math.floor(Math.random() * quickMessages.length)];
    
    try {
      await api.sendEncouragement(userId, toUserId, poolId, message);
      Alert.alert('Sent!', 'Encouragement sent! 🎉');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error sending encouragement:', error);
      Alert.alert('Error', 'Failed to send encouragement');
    }
  };

  const followUser = async (targetUserId) => {
    try {
      await api.followUser(targetUserId, userId);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const unfollowUser = async (targetUserId) => {
    try {
      await api.unfollowUser(targetUserId, userId);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const renderActivityItem = (activity) => {
    const activityData = JSON.parse(activity.activity_data);
    
    let content = '';
    let emoji = '';
    
    switch (activity.activity_type) {
      case 'contribution_made':
        content = `made a $${(activityData.amount / 100).toFixed(2)} contribution`;
        emoji = '💰';
        break;
      case 'streak_milestone':
        content = `reached a ${activityData.streak} day streak!`;
        emoji = '🔥';
        break;
      case 'badge_earned':
        content = `earned the "${activityData.badgeName}" badge`;
        emoji = '🏆';
        break;
      case 'solo_pool_created':
        content = `created a new savings goal: ${activityData.name}`;
        emoji = '🎯';
        break;
      case 'level_up':
        content = `leveled up to Level ${activityData.level}!`;
        emoji = '⬆️';
        break;
      default:
        content = 'had some activity';
        emoji = '✨';
    }

    return (
      <View key={activity.id} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {activity.avatar_type === 'generated' && activity.avatar_data ? 
                JSON.parse(activity.avatar_data).hairStyle?.emoji || '👤' : '👤'}
            </Text>
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>
              <Text style={styles.userName}>{activity.user_name}</Text> {content}
            </Text>
            <Text style={styles.activityTime}>
              {new Date(activity.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.activityEmoji}>{emoji}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.encourageButton}
          onPress={() => sendQuickEncouragement(activity.user_id, activity.pool_id)}
        >
          <Text style={styles.encourageButtonText}>💪 Encourage</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEncouragement = (encouragement) => (
    <View key={encouragement.id} style={styles.encouragementCard}>
      <View style={styles.encouragementHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {encouragement.avatar_type === 'generated' && encouragement.avatar_data ? 
              JSON.parse(encouragement.avatar_data).hairStyle?.emoji || '👤' : '👤'}
          </Text>
        </View>
        <View style={styles.encouragementInfo}>
          <Text style={styles.encouragementFrom}>
            From <Text style={styles.userName}>{encouragement.from_user_name}</Text>
          </Text>
          <Text style={styles.encouragementTime}>
            {new Date(encouragement.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.encouragementMessage}>{encouragement.message}</Text>
      {encouragement.pool_name && (
        <Text style={styles.encouragementPool}>
          Re: {encouragement.pool_name}
        </Text>
      )}
    </View>
  );

  const renderFollowCard = (user, isFollowing = false) => (
    <View key={user.id} style={styles.followCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.avatar_type === 'generated' && user.avatar_data ? 
            JSON.parse(user.avatar_data).hairStyle?.emoji || '👤' : '👤'}
        </Text>
      </View>
      <View style={styles.followInfo}>
        <Text style={styles.followName}>{user.name}</Text>
        <Text style={styles.followStats}>
          Level {user.level} • 🔥 {user.current_streak} streak
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.followButton, isFollowing && styles.unfollowButton]}
        onPress={() => isFollowing ? unfollowUser(user.id) : followUser(user.id)}
      >
        <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statText}>{follows.followers.length} followers</Text>
          <Text style={styles.statText}>{follows.following.length} following</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'encouragements' && styles.activeTab]}
          onPress={() => setActiveTab('encouragements')}
        >
          <Text style={[styles.tabText, activeTab === 'encouragements' && styles.activeTabText]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'follows' && styles.activeTab]}
          onPress={() => setActiveTab('follows')}
        >
          <Text style={[styles.tabText, activeTab === 'follows' && styles.activeTabText]}>
            Network
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'feed' && (
          <View>
            {feed.length > 0 ? (
              feed.map(renderActivityItem)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Follow friends to see their savings activities here! 🌟
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'encouragements' && (
          <View>
            {encouragements.length > 0 ? (
              encouragements.map(renderEncouragement)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No encouragements yet. Your friends' support will appear here! 💪
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'follows' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Following ({follows.following.length})</Text>
              {follows.following.map(user => renderFollowCard(user, true))}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Followers ({follows.followers.length})</Text>
              {follows.followers.map(user => renderFollowCard(user, false))}
            </View>

            {follows.following.length === 0 && follows.followers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Start following friends to build your savings network! 🤝
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  headerStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#666',
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
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  userName: {
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityEmoji: {
    fontSize: 20,
  },
  encourageButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  encourageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  encouragementCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderLeftWidth: 4,
    borderLeftColor: '#34A853',
  },
  encouragementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  encouragementInfo: {
    flex: 1,
  },
  encouragementFrom: {
    fontSize: 14,
    color: '#333',
  },
  encouragementTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  encouragementMessage: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  encouragementPool: {
    fontSize: 12,
    color: '#4285F4',
  },
  followCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  followInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  followStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  unfollowButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unfollowButtonText: {
    color: '#4285F4',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
