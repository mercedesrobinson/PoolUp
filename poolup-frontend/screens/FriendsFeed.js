import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function FriendsFeed({ navigation, route }) {
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, friends, groups
  const userId = route.params?.userId || '1756612920173';

  useEffect(() => {
    loadFriendsFeed();
  }, [filter]);

  const loadFriendsFeed = async () => {
    try {
      const feedData = await api.getFriendsFeed(userId, filter);
      setActivities(feedData);
    } catch (error) {
      console.error('Failed to load friends feed:', error);
      // Mock data for development
      setActivities([
        {
          id: 1,
          type: 'contribution',
          user: { name: 'Sarah', avatar: '👩‍💼' },
          pool: { name: 'Bali Adventure', destination: 'Bali' },
          amount: 15000, // cents
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isPublic: true
        },
        {
          id: 2,
          type: 'milestone',
          user: { name: 'Mike', avatar: '👨‍💻' },
          pool: { name: 'Tokyo Trip', destination: 'Tokyo' },
          milestone: 50,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          isPublic: true
        },
        {
          id: 3,
          type: 'streak',
          user: { name: 'Emma', avatar: '👩‍🎨' },
          streakDays: 14,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isPublic: true
        },
        {
          id: 4,
          type: 'pool_created',
          user: { name: 'Alex', avatar: '👨‍🚀' },
          pool: { name: 'Iceland Northern Lights', destination: 'Iceland' },
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isPublic: true
        }
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendsFeed();
    setRefreshing(false);
  };

  const addComment = async (activityId) => {
    try {
      // Navigate to comment modal or show inline comment input
      // For now, show a simple alert - can be enhanced later
      Alert.alert('Add Comment', 'Comment functionality coming soon!');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getShareMessage = (activity) => {
    switch (activity.type) {
      case 'contribution':
        return `${activity.user.name} just saved $${(activity.amount / 100).toFixed(2)} for their ${activity.pool.destination} trip! 🎯`;
      case 'milestone':
        return `${activity.user.name} hit ${activity.milestone}% of their ${activity.pool.destination} savings goal! 🎉`;
      case 'streak':
        return `${activity.user.name} is on a ${activity.streakDays}-day savings streak! 🔥`;
      case 'pool_created':
        return `${activity.user.name} started saving for ${activity.pool.destination}! Join the adventure! ✈️`;
      default:
        return `Check out what's happening on PoolUp! 🌟`;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderActivity = (activity) => {
    return (
      <View key={activity.id} style={{
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: radius,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 32, marginRight: 12 }}>{activity.user.avatar}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {activity.user.name}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {getTimeAgo(activity.timestamp)}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => addComment(activity.id)}
            style={{ padding: 8 }}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
          </TouchableOpacity>
        </View>

        {activity.type === 'contribution' && (
          <View>
            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>
              💰 Saved <Text style={{ fontWeight: '700', color: colors.primary }}>
                ${(activity.amount / 100).toFixed(2)}
              </Text> for {activity.pool.destination}
            </Text>
            <View style={{ 
              backgroundColor: colors.primaryLight, 
              padding: 12, 
              borderRadius: radius,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary
            }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                🎯 {activity.pool.name}
              </Text>
            </View>
          </View>
        )}

        {activity.type === 'milestone' && (
          <View>
            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>
              🎉 Hit <Text style={{ fontWeight: '700', color: colors.success }}>
                {activity.milestone}%
              </Text> of their savings goal!
            </Text>
            <View style={{ 
              backgroundColor: '#e8f5e8', 
              padding: 12, 
              borderRadius: radius,
              borderLeftWidth: 4,
              borderLeftColor: colors.success
            }}>
              <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>
                ✈️ {activity.pool.name}
              </Text>
            </View>
          </View>
        )}

        {activity.type === 'streak' && (
          <View style={{ 
            backgroundColor: '#fff3e0', 
            padding: 12, 
            borderRadius: radius,
            borderLeftWidth: 4,
            borderLeftColor: '#ff9800'
          }}>
            <Text style={{ fontSize: 14, color: colors.text }}>
              🔥 On a <Text style={{ fontWeight: '700', color: '#ff9800' }}>
                {activity.streakDays}-day
              </Text> savings streak!
            </Text>
          </View>
        )}

        {activity.type === 'pool_created' && (
          <View>
            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>
              🚀 Started a new savings adventure!
            </Text>
            <View style={{ 
              backgroundColor: colors.primaryLight, 
              padding: 12, 
              borderRadius: radius,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary
            }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                🌟 {activity.pool.name}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 20, 
        paddingTop: 20,
        paddingBottom: 20
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            padding: 8,
            alignSelf: 'flex-start'
          }}
        >
          <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold', marginRight: 8 }}>←</Text>
          <Text style={{ color: 'black', fontSize: 16, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        
        <Text style={{ 
          fontSize: 28, 
          fontWeight: '700', 
          color: colors.text,
          marginBottom: 16
        }}>
          Friends Feed
        </Text>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {[
            { key: 'all', label: 'All Activity' },
            { key: 'friends', label: 'Friends' },
            { key: 'groups', label: 'My Groups' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 12,
                borderRadius: 20,
                backgroundColor: filter === tab.key ? colors.primary : colors.background,
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: filter === tab.key ? 'white' : colors.textSecondary
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activities.length === 0 ? (
          <View style={{ 
            backgroundColor: 'white', 
            padding: 32, 
            borderRadius: radius,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8
            }}>
              No activity yet
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textSecondary,
              textAlign: 'center'
            }}>
              Invite friends to see their savings progress and celebrate together!
            </Text>
          </View>
        ) : (
          activities.map(renderActivity)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
