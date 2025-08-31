import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function GroupActivity({ navigation, route }) {
  const { user } = route.params || {};
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, contributions, milestones, boosts

  useEffect(() => {
    loadGroupActivity();
  }, [filter]);

  const loadGroupActivity = async () => {
    try {
      // Set mock data immediately
      const mockActivities = [
        {
          id: 1,
          type: 'contribution',
          user: { name: 'Sarah M.', avatar: '👩‍💼' },
          pool: { name: 'Tokyo Adventure', destination: 'Tokyo' },
          amount: 15000,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          streak: 5
        },
        {
          id: 2,
          type: 'milestone',
          user: { name: 'Mike R.', avatar: '👨‍💻' },
          pool: { name: 'Emergency Fund', destination: 'Financial Security' },
          milestone: '50% Goal Reached',
          amount: 250000,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          type: 'boost',
          user: { name: 'Alex K.', avatar: '👨‍🎨' },
          boostedUser: { name: 'Jenny L.', avatar: '👩‍🔬' },
          pool: { name: 'Bali Getaway', destination: 'Bali' },
          amount: 5000,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          type: 'contribution',
          user: { name: 'Emma W.', avatar: '👩‍🎓' },
          pool: { name: 'Dream Car Fund', destination: 'Tesla Model 3' },
          amount: 30000,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          streak: 12
        },
        {
          id: 5,
          type: 'milestone',
          user: { name: 'David L.', avatar: '👨‍🚀' },
          pool: { name: 'House Down Payment', destination: 'Home Ownership' },
          milestone: '75% Goal Reached',
          amount: 750000,
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setActivities(mockActivities);
      console.log('GroupActivity loaded with mock data');
    } catch (error) {
      console.error('Failed to load group activity:', error);
      setActivities([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupActivity();
    setRefreshing(false);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'contribution': return '💰';
      case 'milestone': return '🎯';
      case 'boost': return '🤝';
      case 'streak': return '🔥';
      default: return '📈';
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

  const renderActivity = (activity) => (
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>
          {getActivityIcon(activity.type)}
        </Text>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>
              {activity.user.avatar}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {activity.user.name}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 'auto' }}>
              {getTimeAgo(activity.timestamp)}
            </Text>
          </View>
          
          {activity.type === 'contribution' && (
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              Contributed ${(activity.amount / 100).toFixed(2)} to{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {activity.pool.name}
              </Text>
              {activity.streak && (
                <Text style={{ color: colors.orange }}>
                  {' '}🔥 {activity.streak} day streak!
                </Text>
              )}
            </Text>
          )}
          
          {activity.type === 'milestone' && (
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              <Text style={{ fontWeight: '600', color: colors.success }}>
                {activity.milestone}
              </Text>
              {' '}in{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {activity.pool.name}
              </Text>
              {' '}(${(activity.amount / 100).toFixed(2)} saved!)
            </Text>
          )}
          
          {activity.type === 'boost' && (
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              Boosted{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {activity.boostedUser.name}
              </Text>
              {' '}with ${(activity.amount / 100).toFixed(2)} in{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {activity.pool.name}
              </Text>
            </Text>
          )}
          
          <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>
            🎯 {activity.pool.destination}
          </Text>
        </View>
      </View>
    </View>
  );

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 16 }}
          >
            <Text style={{ fontSize: 18, color: 'white' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: 'white',
            flex: 1
          }}>
            🔥 Group Activity
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 20 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {[
            { key: 'all', label: 'All', icon: '📈' },
            { key: 'contribution', label: 'Contributions', icon: '💰' },
            { key: 'milestone', label: 'Milestones', icon: '🎯' },
            { key: 'boost', label: 'Boosts', icon: '🤝' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                borderRadius: 16,
                backgroundColor: filter === tab.key ? colors.primary : colors.background,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: filter === tab.key ? 'white' : colors.textSecondary
              }}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activity Feed */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.length > 0 ? (
          filteredActivities.map(renderActivity)
        ) : (
          <View style={{
            backgroundColor: 'white',
            padding: 40,
            borderRadius: radius,
            alignItems: 'center',
            marginTop: 40
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤝</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              No Group Activity Yet
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 20
            }}>
              Join a savings pool or invite friends to start seeing group activity here!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
