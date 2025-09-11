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
      // Define all available badges (both earned and unearned)
      const allAvailableBadges: Badge[] = [
        // Invite Badges
        {
          id: 'invite_1',
          name: 'Pool Buddy',
          description: "Invite 1 friend to join PoolUp. You've got company! Saving is better together.",
          icon: '🤝',
          category: 'invite',
          points_required: 10,
          rarity: 'common'
        },
        {
          id: 'invite_3',
          name: 'Squad Builder',
          description: "Invite 3 friends to join PoolUp. Now it's a squad goal — literally.",
          icon: '👯‍♀️',
          category: 'invite',
          points_required: 30,
          rarity: 'uncommon'
        },
        {
          id: 'invite_5',
          name: 'Money Magnet',
          description: "Invite 5 friends to join PoolUp. Your friends can't resist pooling up with you.",
          icon: '💸',
          category: 'invite',
          points_required: 50,
          rarity: 'rare'
        },
        {
          id: 'invite_10',
          name: 'Pool Party Starter',
          description: 'Invite 10 friends to join PoolUp. You just turned saving into a party.',
          icon: '🎉',
          category: 'invite',
          points_required: 100,
          rarity: 'epic'
        },
        {
          id: 'invite_15',
          name: 'Super Connector',
          description: 'Invite 15 friends to join PoolUp. The ultimate hype saver — you bring everyone along.',
          icon: '🌟',
          category: 'invite',
          points_required: 150,
          rarity: 'legendary'
        },

        // Multiple Pool Badges
        {
          id: 'pools_2',
          name: 'Double Dipper',
          description: "Create 2 active pools. You're saving for more than one dream at a time.",
          icon: '🍦',
          category: 'pools',
          points_required: 25,
          rarity: 'common'
        },
        {
          id: 'pools_3',
          name: 'Triple Threat',
          description: 'Create 3 active pools. Juggling goals like a pro.',
          icon: '🎬',
          category: 'pools',
          points_required: 40,
          rarity: 'uncommon'
        },
        {
          id: 'pools_5',
          name: 'Saver Supreme',
          description: 'Create 5 active pools. Master of multitasking your money.',
          icon: '👑',
          category: 'pools',
          points_required: 75,
          rarity: 'rare'
        },
        {
          id: 'pools_7',
          name: 'Lucky Saver',
          description: "Create 7 active pools. Seven pools? You're chasing all the good things in life.",
          icon: '🍀',
          category: 'pools',
          points_required: 100,
          rarity: 'epic'
        },
        {
          id: 'pools_10',
          name: 'Goal Getter',
          description: 'Create 10 active pools. Nothing can stop you — every dream gets a pool.',
          icon: '🚀',
          category: 'pools',
          points_required: 150,
          rarity: 'legendary'
        },

        // Savings Milestone Badges
        {
          id: 'savings_100',
          name: 'Starter Stack',
          description: 'Save $100 total across all pools. Your first step into saving — small but mighty.',
          icon: '💵',
          category: 'savings',
          points_required: 10,
          rarity: 'common'
        },
        {
          id: 'savings_250',
          name: 'Quarter Saver',
          description: "Save $250 total across all pools. You've stacked a solid quarter grand.",
          icon: '🪙',
          category: 'savings',
          points_required: 25,
          rarity: 'common'
        },
        {
          id: 'savings_500',
          name: 'Half-Stack Hero',
          description: 'Save $500 total across all pools. Halfway to your first thousand — consistency pays off.',
          icon: '💪',
          category: 'savings',
          points_required: 50,
          rarity: 'uncommon'
        },
        {
          id: 'savings_1000',
          name: '4-Digit Club',
          description: 'Save $1,000 total across all pools. Welcome to the club — four digits strong.',
          icon: '🔑',
          category: 'savings',
          points_required: 100,
          rarity: 'uncommon'
        },
        {
          id: 'savings_2500',
          name: 'Momentum Maker',
          description: 'Save $2,500 total across all pools. Your discipline is starting to snowball.',
          icon: '⚡',
          category: 'savings',
          points_required: 200,
          rarity: 'rare'
        },
        {
          id: 'savings_5000',
          name: 'Goal Crusher',
          description: 'Save $5,000 total across all pools. Big milestone achieved — dreams within reach.',
          icon: '🎯',
          category: 'savings',
          points_required: 300,
          rarity: 'epic'
        },
        {
          id: 'savings_10000',
          name: 'Money Master',
          description: "Save $10,000 total across all pools. Five figures saved — you've mastered the art of Pooling Up.",
          icon: '🏆',
          category: 'savings',
          points_required: 500,
          rarity: 'legendary'
        }
      ];

      setAllBadges(allAvailableBadges);
      
      // Try to get user's earned badges, but don't fail if API is down
      try {
        const earned = await api.getUserBadges(user.id);
        setEarnedBadges(earned || []);
      } catch (apiError) {
        console.log('API not available, showing all badges as unearned');
        setEarnedBadges([]);
      }
      
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

        {/* Invite Badges */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16, marginTop: earnedCount > 0 ? 24 : 0 }}>
          🎖 Invite Badges for PoolUp
        </Text>
        {Array.isArray(allBadges) ? 
          allBadges.filter(badge => badge.category === 'invite').map(badge => {
            const isEarned = earnedBadges.find(eb => eb.id === badge.id);
            return (
              <BadgeCard key={badge.id} badge={badge} earned={!!isEarned} />
            );
          }) : []}

        {/* Multiple Pool Badges */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16, marginTop: 24 }}>
          🎖 Multiple Pool Badges
        </Text>
        {Array.isArray(allBadges) ? 
          allBadges.filter(badge => badge.category === 'pools').map(badge => {
            const isEarned = earnedBadges.find(eb => eb.id === badge.id);
            return (
              <BadgeCard key={badge.id} badge={badge} earned={!!isEarned} />
            );
          }) : []}

        {/* Savings Milestone Badges */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16, marginTop: 24 }}>
          🎖 Savings Milestone Badges
        </Text>
        {Array.isArray(allBadges) ? 
          allBadges.filter(badge => badge.category === 'savings').map(badge => {
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
