import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type GroupActivityNavigationProp = StackNavigationProp<RootStackParamList, 'GroupActivity'>;
type GroupActivityRouteProp = RouteProp<RootStackParamList, 'GroupActivity'>;

interface Props {
  navigation: GroupActivityNavigationProp;
  route: GroupActivityRouteProp;
}

interface GroupActivity {
  id: string;
  type: 'contribution' | 'milestone' | 'member_joined' | 'goal_reached' | 'encouragement';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  amount?: number;
  milestone?: number;
  message?: string;
  timestamp: string;
}

export default function GroupActivity({ navigation, route }: Props): React.JSX.Element {
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const poolId = (route.params as any)?.poolId || 'pool1';
  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadGroupActivity();
  }, []);

  const loadGroupActivity = async (): Promise<void> => {
    try {
      const groupActivities = await api.getGroupActivity(poolId, userId);
      setActivities(groupActivities);
    } catch (error) {
      console.error('Failed to load group activity:', error);
      // Mock data for development
      setActivities([
        {
          id: '1',
          type: 'contribution',
          user: { id: '2', name: 'Sarah Johnson', avatar: '👩‍💼' },
          amount: 15000, // cents
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'milestone',
          user: { id: '3', name: 'Mike Chen', avatar: '👨‍💻' },
          milestone: 50,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'member_joined',
          user: { id: '4', name: 'Emma Wilson', avatar: '👩‍🎨' },
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'encouragement',
          user: { id: '5', name: 'Alex Rodriguez', avatar: '👨‍🚀' },
          message: 'Great job everyone! Keep up the momentum! 💪',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          type: 'goal_reached',
          user: { id: '2', name: 'Sarah Johnson', avatar: '👩‍💼' },
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadGroupActivity();
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

  const renderActivity = (activity: GroupActivity) => {
    let content = '';
    let icon = '';
    let bgColor = 'white';
    
    switch (activity.type) {
      case 'contribution':
        content = `contributed ${formatAmount(activity.amount!)} to the group goal`;
        icon = '💰';
        bgColor = '#f8f9fa';
        break;
      case 'milestone':
        content = `reached ${activity.milestone}% of the group goal!`;
        icon = '🎯';
        bgColor = '#e7f3ff';
        break;
      case 'member_joined':
        content = 'joined the group';
        icon = '👋';
        bgColor = '#f0f8e7';
        break;
      case 'goal_reached':
        content = 'helped the group reach their savings goal! 🎉';
        icon = '🏆';
        bgColor = '#fff3cd';
        break;
      case 'encouragement':
        content = activity.message || 'sent encouragement to the group';
        icon = '💪';
        bgColor = '#f8e6ff';
        break;
    }

    return (
      <View key={activity.id} style={{
        backgroundColor: bgColor,
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
          <Text style={{ fontSize: 24, marginRight: 12 }}>{activity.user.avatar}</Text>
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
        
        <Text style={{ fontSize: 15, color: '#444', lineHeight: 20, marginLeft: 36 }}>
          {content}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

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
          style={{ padding: 8, marginRight: 12 }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#333',
          flex: 1,
        }}>
          Group Activity
        </Text>
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
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
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
              Group activity will appear here as members contribute and interact with the goal.
            </Text>
          </View>
        ) : (
          activities.map(renderActivity)
        )}

        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 24, marginBottom: 12 }}>💬</Text>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Encourage Your Group
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 16,
          }}>
            Send a motivational message to keep everyone motivated!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat" as any, { poolId })}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: radius.medium,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
              Send Encouragement
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
