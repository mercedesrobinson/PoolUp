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
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points_required: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earned_at?: string;
}


interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
}

function BadgeCard({ badge, earned = false }: BadgeCardProps): React.JSX.Element {
  const rarityColors = {
    common: '#95a5a6',
    uncommon: '#3498db',
    rare: '#9b59b6',
    epic: '#e74c3c',
    legendary: '#f39c12'
  };

  const rarityGradients = {
    common: ['#bdc3c7', '#95a5a6'],
    uncommon: ['#74b9ff', '#3498db'],
    rare: ['#a29bfe', '#9b59b6'],
    epic: ['#fd79a8', '#e74c3c'],
    legendary: ['#fdcb6e', '#f39c12']
  };

  return (
    <View style={{ 
      backgroundColor: earned ? 'white' : '#f8f9fa',
      padding: 16, 
      borderRadius: radius.medium, 
      marginBottom: 12,
      borderWidth: 2,
      borderColor: earned ? rarityColors[badge.rarity] : '#e9ecef',
      opacity: earned ? 1 : 0.6
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
          width: 60, 
          height: 60, 
          borderRadius: 30, 
          backgroundColor: rarityColors[badge.rarity],
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 16
        }}>
          <Text style={{ fontSize: 28 }}>{badge.icon}</Text>
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
              color: rarityColors[badge.rarity], 
              textTransform: 'uppercase', 
              fontWeight: '700',
              backgroundColor: `${rarityColors[badge.rarity]}20`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              {badge.rarity}
            </Text>
            {badge.points_required > 0 && (
              <Text style={{ fontSize: 12, color: '#666' }}>
                {badge.points_required} points required
              </Text>
            )}
          </View>
          {earned && badge.earned_at && (
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Earned on {new Date(badge.earned_at).toLocaleDateString()}
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
      // Get user's earned badges
      const earned = await api.getUserBadges(user.id);
      setEarnedBadges(earned);

      // Define all available badges (both earned and unearned)
      const allAvailableBadges: Badge[] = [
        {
          id: '1',
          name: 'First Contribution',
          description: 'Made your first deposit to any pool',
          icon: '🎯',
          category: 'milestone',
          points_required: 0,
          rarity: 'common'
        },
        {
          id: '2',
          name: '7-Day Streak',
          description: 'Saved money for 7 consecutive days',
          icon: '🔥',
          category: 'streak',
          points_required: 50,
          rarity: 'uncommon'
        },
        {
          id: '3',
          name: 'Goal Achiever',
          description: 'Successfully reached your savings target',
          icon: '🎉',
          category: 'achievement',
          points_required: 100,
          rarity: 'rare'
        },
        {
          id: '4',
          name: 'Team Player',
          description: 'Completed a group savings goal with friends',
          icon: '👥',
          category: 'social',
          points_required: 75,
          rarity: 'uncommon'
        },
        {
          id: '5',
          name: 'Savings Master',
          description: 'Saved over $10,000 across all pools',
          icon: '💰',
          category: 'milestone',
          points_required: 500,
          rarity: 'epic'
        },
        {
          id: '6',
          name: 'Consistency King',
          description: 'Maintained a 30-day savings streak',
          icon: '👑',
          category: 'streak',
          points_required: 200,
          rarity: 'epic'
        },
        {
          id: '7',
          name: 'Pool Creator',
          description: 'Created your first savings pool',
          icon: '🏊‍♂️',
          category: 'milestone',
          points_required: 25,
          rarity: 'common'
        },
        {
          id: '8',
          name: 'Travel Fund Champion',
          description: 'Completed a travel savings goal',
          icon: '✈️',
          category: 'category',
          points_required: 150,
          rarity: 'rare'
        }
      ];

      setAllBadges(allAvailableBadges);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load badges:', error);
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
        {/* Show earned badges if any */}
        {earnedBadges.length > 0 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              ✨ Your Badges
            </Text>
            {earnedBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} earned={true} />
            ))}
          </>
        )}

        {/* Empty state if no badges */}
        {earnedBadges.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              No badges yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              Start saving and inviting friends to earn your first badges!
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16, marginTop: earnedCount > 0 ? 24 : 0 }}>
          🎯 All Badges
        </Text>
        {Array.isArray(allBadges) ? 
          allBadges.map(badge => {
            const isEarned = earnedBadges.find(eb => eb.id === badge.id);
            return (
              <BadgeCard key={badge.id} badge={badge} earned={!!isEarned} />
            );
          }) : []}

        {earnedCount === 0 && (
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius.medium, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
              Start Your Badge Journey!
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              Make your first contribution to earn your first badge and start climbing the leaderboards!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
