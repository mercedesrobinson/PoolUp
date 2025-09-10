import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type BadgesNavigationProp = StackNavigationProp<RootStackParamList, 'Badges'>;
type BadgesRouteProp = RouteProp<RootStackParamList, 'Badges'>;

interface Props {
  navigation: BadgesNavigationProp;
  route: BadgesRouteProp;
}

interface Badge {
  id?: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  type: string;
  level: number;
  threshold: number;
  earned: boolean;
  currentValue: number;
  unlockedAt?: string;
}

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
}

function BadgeCard({ badge, earned = false }: BadgeCardProps): React.JSX.Element {
  const categoryColors = {
    friends: colors.blue,
    pools: colors.green,
    savings: colors.purple
  };

  return (
    <View style={{ 
      backgroundColor: earned ? 'white' : '#f8f9fa',
      padding: 16, 
      borderRadius: radius.medium, 
      marginBottom: 12,
      borderWidth: 2,
      borderColor: earned ? categoryColors[badge.category as keyof typeof categoryColors] || colors.gray : '#e9ecef',
      opacity: earned ? 1 : 0.6
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
          width: 60, 
          height: 60, 
          borderRadius: 30, 
          backgroundColor: categoryColors[badge.category as keyof typeof categoryColors] || colors.gray,
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 16
        }}>
          <Text style={{ fontSize: 28 }}>{badge.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
              {badge.name}
            </Text>
            {earned && (
              <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>
                ✓ EARNED
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {badge.description}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 12, 
              color: categoryColors[badge.category as keyof typeof categoryColors] || colors.gray, 
              textTransform: 'uppercase', 
              fontWeight: '700',
              backgroundColor: `${categoryColors[badge.category as keyof typeof categoryColors] || colors.gray}20`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              {badge.category}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {badge.currentValue}/{badge.threshold}
            </Text>
          </View>
          {earned && badge.unlockedAt && (
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Earned on {new Date(badge.unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Badges({ navigation, route }: Props): React.JSX.Element {
  const { user } = (route?.params as any) || {};
  
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading user data...</Text>
      </View>
    );
  }
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Define all possible badges that users can earn
  const getAllPossibleBadges = (): Badge[] => {
    return [
      // Friends Badges
      {
        name: "Social Butterfly",
        description: "Invite your first friend to join PoolUp",
        emoji: "🦋",
        category: "friends",
        type: "invites",
        level: 1,
        threshold: 1,
        earned: false,
        currentValue: 0
      },
      {
        name: "Squad Builder",
        description: "Invite 5 friends to join PoolUp",
        emoji: "👥",
        category: "friends",
        type: "invites",
        level: 2,
        threshold: 5,
        earned: false,
        currentValue: 0
      },
      {
        name: "Network Master",
        description: "Invite 10 friends to join PoolUp",
        emoji: "🌟",
        category: "friends",
        type: "invites",
        level: 3,
        threshold: 10,
        earned: false,
        currentValue: 0
      },
      {
        name: "Community Leader",
        description: "Invite 25 friends to join PoolUp",
        emoji: "👑",
        category: "friends",
        type: "invites",
        level: 4,
        threshold: 25,
        earned: false,
        currentValue: 0
      },

      // Pool Badges
      {
        name: "Pool Pioneer",
        description: "Create your first savings pool",
        emoji: "🏊‍♀️",
        category: "pools",
        type: "pools_created",
        level: 1,
        threshold: 1,
        earned: false,
        currentValue: 0
      },
      {
        name: "Pool Architect",
        description: "Create 3 different savings pools",
        emoji: "🏗️",
        category: "pools",
        type: "pools_created",
        level: 2,
        threshold: 3,
        earned: false,
        currentValue: 0
      },
      {
        name: "Pool Master",
        description: "Create 10 savings pools",
        emoji: "🎯",
        category: "pools",
        type: "pools_created",
        level: 3,
        threshold: 10,
        earned: false,
        currentValue: 0
      },
      {
        name: "Goal Getter",
        description: "Complete your first savings goal",
        emoji: "🎉",
        category: "pools",
        type: "goals_completed",
        level: 1,
        threshold: 1,
        earned: false,
        currentValue: 0
      },
      {
        name: "Achievement Hunter",
        description: "Complete 5 savings goals",
        emoji: "🏆",
        category: "pools",
        type: "goals_completed",
        level: 2,
        threshold: 5,
        earned: false,
        currentValue: 0
      },

      // Savings Badges
      {
        name: "First Steps",
        description: "Make your first contribution",
        emoji: "👶",
        category: "savings",
        type: "contributions",
        level: 1,
        threshold: 1,
        earned: false,
        currentValue: 0
      },
      {
        name: "Consistent Saver",
        description: "Make 10 contributions",
        emoji: "💪",
        category: "savings",
        type: "contributions",
        level: 2,
        threshold: 10,
        earned: false,
        currentValue: 0
      },
      {
        name: "Savings Warrior",
        description: "Make 50 contributions",
        emoji: "⚔️",
        category: "savings",
        type: "contributions",
        level: 3,
        threshold: 50,
        earned: false,
        currentValue: 0
      },
      {
        name: "Savings Legend",
        description: "Make 100 contributions",
        emoji: "🔥",
        category: "savings",
        type: "contributions",
        level: 4,
        threshold: 100,
        earned: false,
        currentValue: 0
      },
      {
        name: "Penny Saver",
        description: "Save your first $100",
        emoji: "🪙",
        category: "savings",
        type: "total_saved",
        level: 1,
        threshold: 10000, // in cents
        earned: false,
        currentValue: 0
      },
      {
        name: "Dollar Dynamo",
        description: "Save $1,000 total",
        emoji: "💵",
        category: "savings",
        type: "total_saved",
        level: 2,
        threshold: 100000, // in cents
        earned: false,
        currentValue: 0
      },
      {
        name: "Savings Superstar",
        description: "Save $5,000 total",
        emoji: "⭐",
        category: "savings",
        type: "total_saved",
        level: 3,
        threshold: 500000, // in cents
        earned: false,
        currentValue: 0
      },
      {
        name: "Millionaire Mindset",
        description: "Save $10,000 total",
        emoji: "💎",
        category: "savings",
        type: "total_saved",
        level: 4,
        threshold: 1000000, // in cents
        earned: false,
        currentValue: 0
      },
      {
        name: "Streak Starter",
        description: "Maintain a 7-day saving streak",
        emoji: "🔥",
        category: "savings",
        type: "streak",
        level: 1,
        threshold: 7,
        earned: false,
        currentValue: 0
      },
      {
        name: "Streak Master",
        description: "Maintain a 30-day saving streak",
        emoji: "🚀",
        category: "savings",
        type: "streak",
        level: 2,
        threshold: 30,
        earned: false,
        currentValue: 0
      }
    ];
  };

  const loadBadges = async (): Promise<void> => {
    try {
      // Get all possible badges
      const allPossibleBadges = getAllPossibleBadges();
      
      // Try to get earned badges from backend
      const earnedBadgesData = await api.getUserBadges(user.id);
      
      // Merge earned status with all possible badges
      const badgesWithStatus = allPossibleBadges.map(badge => {
        const earnedBadge = earnedBadgesData.find((eb: any) => 
          eb.type === badge.type && eb.level === badge.level
        );
        
        if (earnedBadge) {
          return {
            ...badge,
            earned: true,
            currentValue: earnedBadge.currentValue || badge.threshold,
            unlockedAt: earnedBadge.unlockedAt,
            id: earnedBadge.id
          };
        }
        
        return badge;
      });
      
      const earnedBadges = badgesWithStatus.filter(b => b.earned);
      setEarnedBadges(earnedBadges);
      setAllBadges(badgesWithStatus);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load badges:', error);
      // Still show all possible badges even if API fails
      const allPossibleBadges = getAllPossibleBadges();
      setAllBadges(allPossibleBadges);
      setEarnedBadges([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const earnedCount = earnedBadges.length;
  const totalCount = allBadges.length;
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  if (loading) return <View style={{ flex: 1, backgroundColor: '#FAFCFF' }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ padding: 24, backgroundColor: colors.purple, paddingTop: 80 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', textAlign: 'center' }}>
          🏆 Badge Collection
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8 }}>
          {earnedCount} of {totalCount} badges earned
        </Text>
        <View style={{ 
          height: 8, 
          backgroundColor: 'rgba(255,255,255,0.3)', 
          borderRadius: 4, 
          marginTop: 12,
          overflow: 'hidden'
        }}>
          <View style={{ 
            width: `${progress}%`, 
            backgroundColor: 'white', 
            height: '100%' 
          }} />
        </View>
      </View>

      {/* Badge Categories */}
      <View style={{ padding: 24 }}>
        {/* Friends Badges */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
          🤝 Friends Badges
        </Text>
        {allBadges.filter(b => b.category === 'friends').map(badge => (
          <BadgeCard key={`${badge.type}-${badge.level}`} badge={badge} earned={badge.earned} />
        ))}
        
        {/* Separator */}
        <View style={{ height: 1, backgroundColor: '#e9ecef', marginVertical: 24 }} />
        
        {/* Pools Badges */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
          🏊‍♀️ Pools Badges
        </Text>
        {allBadges.filter(b => b.category === 'pools').map(badge => (
          <BadgeCard key={`${badge.type}-${badge.level}`} badge={badge} earned={badge.earned} />
        ))}
        
        {/* Separator */}
        <View style={{ height: 1, backgroundColor: '#e9ecef', marginVertical: 24 }} />
        
        {/* Savings Badges */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
          💰 Savings Badges
        </Text>
        {allBadges.filter(b => b.category === 'savings').map(badge => (
          <BadgeCard key={`${badge.type}-${badge.level}`} badge={badge} earned={badge.earned} />
        ))}

        {allBadges.length === 0 && (
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius.medium, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
              No Badge Collection Yet
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              Start saving and inviting friends to unlock your first badges!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
