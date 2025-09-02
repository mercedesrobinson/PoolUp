import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type SocialFeedNavigationProp = StackNavigationProp<RootStackParamList, any>;
type SocialFeedRouteProp = RouteProp<RootStackParamList, any>;

interface Props {
  navigation: SocialFeedNavigationProp;
  route: SocialFeedRouteProp;
}

interface FeedItem {
  id: string;
  type: 'contribution' | 'milestone' | 'goal_created' | 'encouragement' | 'streak' | 'badge_earned';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  pool?: {
    id: string;
    name: string;
  };
  amount?: number;
  milestone?: number;
  streakDays?: number;
  badgeName?: string;
  likes: number;
  isLiked: boolean;
}

export default function SocialFeed({ navigation, route }: Props): React.JSX.Element {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const userId = (route.params as any)?.userId || '1756612920173';

  useEffect(() => {
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async (): Promise<void> => {
    try {
      const feed = await api.getSocialFeed(userId);
      setFeedItems(feed);
    } catch (error) {
      console.error('Failed to load social feed:', error);
      // Mock data for development
      setFeedItems([
        {
          id: '1',
          type: 'contribution',
          user: { id: '2', name: 'Sarah Johnson', avatar: '👩‍💼' },
          content: 'contributed $150 to their Bali Adventure fund!',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          pool: { id: 'pool1', name: 'Bali Adventure' },
          amount: 15000,
          likes: 12,
          isLiked: false
        },
        {
          id: '2',
          type: 'milestone',
          user: { id: '3', name: 'Mike Chen', avatar: '👨‍💻' },
          content: 'reached 75% of their Japan Trip goal! 🎯',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          pool: { id: 'pool2', name: 'Japan Trip' },
          milestone: 75,
          likes: 24,
          isLiked: true
        },
        {
          id: '3',
          type: 'streak',
          user: { id: '4', name: 'Emma Wilson', avatar: '👩‍🎨' },
          content: 'is on a 30-day savings streak! 🔥',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          streakDays: 30,
          likes: 18,
          isLiked: false
        },
        {
          id: '4',
          type: 'badge_earned',
          user: { id: '5', name: 'Alex Rodriguez', avatar: '👨‍🚀' },
          content: 'earned the "Consistent Saver" badge! 🏅',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          badgeName: 'Consistent Saver',
          likes: 15,
          isLiked: false
        },
        {
          id: '5',
          type: 'encouragement',
          user: { id: '6', name: 'Lisa Park', avatar: '👩‍🎓' },
          content: 'Keep pushing everyone! We\'re all doing amazing! 💪',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          likes: 8,
          isLiked: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadSocialFeed();
    setRefreshing(false);
  };

  const toggleLike = async (itemId: string): Promise<void> => {
    try {
      await api.toggleFeedItemLike(itemId, userId);
      setFeedItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              isLiked: !item.isLiked,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1
            }
          : item
      ));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
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

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'contribution': return '💰';
      case 'milestone': return '🎯';
      case 'goal_created': return '✨';
      case 'encouragement': return '💪';
      case 'streak': return '🔥';
      case 'badge_earned': return '🏅';
      default: return '📱';
    }
  };

  const renderFeedItem = (item: FeedItem) => (
    <View key={item.id} style={{
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 32, marginRight: 12 }}>{item.user.avatar}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
            {item.user.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
            {formatTimeAgo(item.timestamp)}
          </Text>
        </View>
        <Text style={{ fontSize: 20 }}>{getTypeIcon(item.type)}</Text>
      </View>
      
      <Text style={{ fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 }}>
        {item.content}
      </Text>

      {item.pool && (
        <TouchableOpacity
          onPress={() => navigation.navigate("PoolDetail" as any, { poolId: item.pool!.id })}
          style={{
            backgroundColor: '#f8f9fa',
            padding: 8,
            borderRadius: radius.medium,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '500' }}>
            🎯 {item.pool.name}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={() => toggleLike(item.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.medium,
            backgroundColor: item.isLiked ? '#ffe6e6' : '#f8f9fa',
          }}
        >
          <Text style={{ 
            fontSize: 16, 
            marginRight: 6,
            color: item.isLiked ? '#dc3545' : '#666'
          }}>
            {item.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500',
            color: item.isLiked ? '#dc3545' : '#666'
          }}>
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.medium,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Text style={{ fontSize: 14, color: '#666' }}>💬 Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: radius.medium,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Text style={{ fontSize: 14, color: '#666' }}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: '#333',
          flex: 1,
        }}>
          Social Feed
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatePool')}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.medium,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '500', fontSize: 14 }}>
            + Share Update
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {feedItems.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 32,
            borderRadius: radius.medium,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📱</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No Updates Yet
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#666',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}>
              Follow friends and join groups to see their savings updates and achievements here.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('InviteFriends')}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: radius.medium,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Find Friends
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          feedItems.map(renderFeedItem)
        )}

        <View style={{
          backgroundColor: '#d4edda',
          padding: 16,
          borderRadius: radius.medium,
          marginTop: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#28a745',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#155724', marginBottom: 8 }}>
            💡 Stay Connected
          </Text>
          <Text style={{ fontSize: 14, color: '#155724', lineHeight: 20 }}>
            Like and comment on your friends' achievements to keep everyone motivated on their savings journey!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
