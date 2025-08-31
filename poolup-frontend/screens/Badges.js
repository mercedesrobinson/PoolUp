import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

function BadgeCard({ badge, earned = false }) {
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
      borderRadius: radius, 
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

export default function Badges({ navigation, route }) {
  const { user } = route.params;
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBadges = async () => {
    try {
      // Get user's earned badges
      const earned = await api.getUserBadges(user.id);
      setEarnedBadges(earned);

      // For demo purposes, we'll show some example badges that could be earned
      // In a real app, you'd fetch all available badges from the server
      const exampleBadges = [
        { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', points_required: 70, rarity: 'common' },
        { id: 'big_spender', name: 'Big Spender', description: 'Make a $100+ contribution', icon: '💸', category: 'contribution', points_required: 100, rarity: 'uncommon' },
        { id: 'social_butterfly', name: 'Social Butterfly', description: 'Join 5 different pools', icon: '🦋', category: 'social', points_required: 150, rarity: 'rare' },
        { id: 'travel_guru', name: 'Travel Guru', description: 'Complete 3 travel pools', icon: '🌍', category: 'travel', points_required: 300, rarity: 'epic' },
        { id: 'pool_master', name: 'Pool Master', description: 'Create 10 successful pools', icon: '👑', category: 'leadership', points_required: 1000, rarity: 'legendary' }
      ];

      // Filter out badges user has already earned
      const earnedIds = earned.map(b => b.id);
      const availableBadges = exampleBadges.filter(b => !earnedIds.includes(b.id));
      
      setAllBadges([...earned, ...availableBadges]);
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
        {earnedCount > 0 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              ✨ Your Badges
            </Text>
            {earnedBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} earned={true} />
            ))}
          </>
        )}

        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16, marginTop: earnedCount > 0 ? 24 : 0 }}>
          🎯 Available Badges
        </Text>
        {allBadges.filter(b => !earnedBadges.find(eb => eb.id === b.id)).map(badge => (
          <BadgeCard key={badge.id} badge={badge} earned={false} />
        ))}

        {earnedCount === 0 && (
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius, alignItems: 'center' }}>
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
