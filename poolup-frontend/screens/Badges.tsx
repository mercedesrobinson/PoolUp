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

  const loadBadges = async (): Promise<void> => {
    try {
      // Get all badges with earned status from backend
      const badges = await api.getUserBadges(user.id);
      const earnedBadges = badges.filter((b: any) => b.earned);
      setEarnedBadges(earnedBadges);
      setAllBadges(badges);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load badges:', error);
      setLoading(false);
      // Show empty state instead of mock data
      setAllBadges([]);
      setEarnedBadges([]);
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
