import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

function StatCard({ title, value, subtitle, color = colors.blue }) {
  return (
    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, flex: 1, marginHorizontal: 4 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color, textAlign: 'center' }}>{value}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 2 }}>{subtitle}</Text>}
    </View>
  );
}

function BadgeItem({ badge }) {
  const rarityColors = {
    common: '#95a5a6',
    uncommon: '#3498db',
    rare: '#9b59b6',
    epic: '#e74c3c',
    legendary: '#f39c12'
  };

  return (
    <View style={{ 
      backgroundColor: 'white', 
      padding: 12, 
      borderRadius: radius, 
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: rarityColors[badge.rarity] || rarityColors.common
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 32, marginRight: 12 }}>{badge.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{badge.name}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{badge.description}</Text>
          <Text style={{ fontSize: 12, color: rarityColors[badge.rarity], marginTop: 4, textTransform: 'uppercase', fontWeight: '600' }}>
            {badge.rarity}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = {
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.blue,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    fontSize: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  customizeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  customizeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default function Profile({ navigation, route }) {
  const { user } = route?.params || {};
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [card, setCard] = useState(null);

  // Early return if no user data
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFCFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Loading user data...</Text>
      </View>
    );
  }

  const loadProfile = async () => {
    try {
      // Use mock data for now to prevent API errors
      const mockProfile = {
        name: user.name || 'User',
        xp: 150,
        total_points: 250,
        current_streak: 3,
        badge_count: 2,
        avatar_type: 'default',
        avatar_data: null
      };
      
      const mockBadges = [
        {
          id: 1,
          name: 'First Contribution',
          description: 'Made your first pool contribution',
          icon: '🎯',
          rarity: 'common'
        }
      ];
      
      setProfile(mockProfile);
      setBadges(mockBadges);
      setCard(null); // No card initially
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const createCard = async () => {
    try {
      const newCard = await api.createDebitCard(user.id, user.name);
      setCard(newCard);
      Alert.alert('Success!', 'Your PoolUp debit card has been created! 🎉');
    } catch (error) {
      Alert.alert('Error', 'Failed to create debit card');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) {
    // Show loading state with basic user info
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
        <View style={{ padding: 24, backgroundColor: colors.purple, paddingTop: 80 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32, color: 'white' }}>👤</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 8 }}>{user.name}</Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>Level 1</Text>
          </View>
        </View>
        
        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, flex: 1, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.purple, textAlign: 'center' }}>0</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>Points</Text>
            </View>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, flex: 1, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.coral, textAlign: 'center' }}>0🔥</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>Streak</Text>
            </View>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, flex: 1, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.green, textAlign: 'center' }}>0</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>Badges</Text>
            </View>
          </View>
          
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Quick Actions</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Pools', { user })}
              style={{ backgroundColor: colors.green, padding: 12, borderRadius: radius, marginBottom: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>View Pools</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CreatePool', { user })}
              style={{ backgroundColor: colors.purple, padding: 12, borderRadius: radius }}
            >
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Create New Pool</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const level = Math.floor((profile?.xp || 0) / 100) + 1;
  const xpProgress = ((profile?.xp || 0) % 100) / 100;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ padding: 24, backgroundColor: colors.purple, paddingTop: 80 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
            <TouchableOpacity style={styles.editBadge} onPress={() => navigation.navigate('ProfilePhotoUpload')}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 18, color: 'white', opacity: 0.9 }}>Level {level}</Text>
          <View style={{ 
            height: 8, 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            borderRadius: 4, 
            flex: 1, 
            marginLeft: 12,
            overflow: 'hidden'
          }}>
            <View style={{ 
              width: `${xpProgress * 100}%`, 
              backgroundColor: 'white', 
              height: '100%' 
            }} />
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={{ padding: 24, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <StatCard title="Points" value={profile?.total_points || 0} color={colors.purple} />
          <StatCard title="Streak" value={`${profile?.current_streak || 0}🔥`} subtitle="days" color={colors.coral} />
          <StatCard title="Badges" value={profile?.badge_count || 0} color={colors.green} />
        </View>


        {/* Badges Section */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              🏆 Badges ({badges.length})
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Badges', { user, badges })}>
              <Text style={{ color: colors.blue, fontWeight: '600' }}>View All →</Text>
            </TouchableOpacity>
          </View>
          {badges.slice(0, 3).map(badge => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
          {badges.length === 0 && (
          <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>
            No badges yet. Start contributing to earn your first badge! 🎯
          </Text>
        )}
      </View>

      {/* Savings Progress */}
      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          💰 Savings Progress
        </Text>
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Total Saved</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.green }}>$1,250</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Monthly Goal</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.blue }}>$500</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>This Month</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.purple }}>$320</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={{ backgroundColor: '#f0f0f0', height: 8, borderRadius: 4, marginBottom: 8 }}>
            <View style={{ 
              backgroundColor: colors.green, 
              height: '100%', 
              width: '64%', 
              borderRadius: 4 
            }} />
          </View>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            64% of monthly goal • $180 to go
          </Text>
        </View>
        
        {/* Projection */}
        <View style={{ backgroundColor: colors.blue + '10', padding: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
            📈 12-Month Projection
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            At your current pace, you'll save <Text style={{ fontWeight: '700', color: colors.green }}>$6,000</Text> by next year
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate('CreatePool', { user })} style={{ backgroundColor: colors.green, padding: 12, borderRadius: radius, flex: 1, marginRight: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>New Pool</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SoloSavings')} style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius, flex: 1, marginLeft: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>Solo Goal</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings', { user })} style={{ backgroundColor: colors.gray, padding: 12, borderRadius: radius, alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ScrollView>
);
}
