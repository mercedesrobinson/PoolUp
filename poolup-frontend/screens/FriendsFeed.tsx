import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type FriendsFeedNavigationProp = StackNavigationProp<RootStackParamList, 'FriendsFeed'>;
type FriendsFeedRouteProp = RouteProp<RootStackParamList, 'FriendsFeed'>;

interface Props {
  navigation: FriendsFeedNavigationProp;
  route: FriendsFeedRouteProp;
}

interface Activity {
  id: number;
  type: 'contribution' | 'milestone' | 'streak' | 'goal_created' | 'encouragement';
  user: {
    name: string;
    photo?: string;
  };
  pool?: {
    name: string;
    destination?: string;
  };
  amount?: number;
  milestone?: number;
  streakDays?: number;
  timestamp: string;
  isPublic: boolean;
  message?: string;
}

export default function FriendsFeed({ navigation, route }: Props): React.JSX.Element {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'friends' | 'groups'>('all');
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadFriendsFeed();
  }, [filter]);

  const loadFriendsFeed = async (): Promise<void> => {
    try {
      const feedData = await api.getFriendsFeed(userId, filter);
      setActivities(feedData);
    } catch (error) {
      console.error('Failed to load friends feed:', error);
      // Production ready - show empty state on error
      setActivities([]);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadFriendsFeed();
    setRefreshing(false);
  };

  const formatAmount = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return time.toLocaleDateString();
  };

  const renderActivity = (activity: Activity) => {
    let content = '';
    let icon = '';
    
    switch (activity.type) {
      case 'contribution':
        content = `contributed ${formatAmount(activity.amount!)} to ${activity.pool?.name}`;
        icon = '💰';
        break;
      case 'milestone':
        content = `reached ${activity.milestone}% of their ${activity.pool?.name} goal`;
        icon = '🎯';
        break;
      case 'streak':
        content = `is on a ${activity.streakDays}-day savings streak!`;
        icon = '🔥';
        break;
      case 'goal_created':
        content = `created a new goal: ${activity.pool?.name}`;
        icon = '✨';
        break;
      case 'encouragement':
        content = activity.message || 'sent encouragement';
        icon = '💪';
        break;
    }

    return (
      <View key={activity.id} style={{
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: radius.medium,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            backgroundColor: '#f0f0f0', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginRight: 12 
          }}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
              {activity.user.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
              {formatTimeAgo(activity.timestamp)}
            </Text>
          </View>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        
        <Text style={{ fontSize: 15, color: '#444', lineHeight: 20 }}>
          {content}
        </Text>
        
        {activity.pool?.destination && (
          <Text style={{ fontSize: 13, color: colors.primary, marginTop: 4, fontWeight: '500' }}>
            🌍 {activity.pool.destination}
          </Text>
        )}
      </View>
    );
  };

  const FilterButton = ({ title, value, isActive }: { title: string; value: 'all' | 'friends' | 'groups'; isActive: boolean }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radius.medium,
        backgroundColor: isActive ? colors.primary : '#f8f9fa',
        marginRight: 8,
      }}
    >
      <Text style={{
        color: isActive ? 'white' : '#666',
        fontWeight: isActive ? '600' : '500',
        fontSize: 14,
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#333',
          flex: 1,
        }}>
          Activity Feed
        </Text>
      </View>

      <View style={{
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
      }}>
        <FilterButton title="All" value="all" isActive={filter === 'all'} />
        <FilterButton title="Friends" value="friends" isActive={filter === 'friends'} />
        <FilterButton title="Groups" value="groups" isActive={filter === 'groups'} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activities.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 32,
            borderRadius: radius.medium,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No Activity Yet
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
            }}>
              Follow friends and join groups to see their savings activity here.
            </Text>
          </View>
        ) : (
          activities.map(renderActivity)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
