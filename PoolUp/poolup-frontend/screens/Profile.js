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

export default function Profile({ navigation, route }) {
  const { user } = route.params;
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [card, setCard] = useState(null);

  const loadProfile = async () => {
    try {
      const [profileData, badgesData, cardData] = await Promise.all([
        api.getUserProfile(user.id),
        api.getUserBadges(user.id),
        api.getDebitCard(user.id)
      ]);
      setProfile(profileData);
      setBadges(badgesData);
      setCard(cardData);
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
        <View style={{ padding: 24, backgroundColor: colors.purple, paddingTop: 60 }}>
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

  const level = Math.floor(profile.xp / 100) + 1;
  const xpProgress = (profile.xp % 100) / 100;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
      {/* Header */}
      <View style={{ padding: 24, backgroundColor: colors.purple, paddingTop: 60 }}>
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('AvatarBuilder', { userId: user.id, currentAvatar: profile.avatar })}
          >
            <Text style={styles.avatarText}>
              {profile.avatar_type === 'generated' && profile.avatar_data ? 
                JSON.parse(profile.avatar_data).hairStyle?.emoji || '👤' : '👤'}
            </Text>
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{profile.name}</Text>
          <TouchableOpacity 
            style={styles.customizeButton}
            onPress={() => navigation.navigate('AvatarBuilder', { userId: user.id, currentAvatar: profile.avatar })}
          >
            <Text style={styles.customizeButtonText}>Customize Avatar</Text>
          </TouchableOpacity>
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
          <StatCard title="Points" value={profile.total_points} color={colors.purple} />
          <StatCard title="Streak" value={`${profile.current_streak}🔥`} subtitle="days" color={colors.coral} />
          <StatCard title="Badges" value={profile.badge_count} color={colors.green} />
        </View>

        {/* Debit Card Section */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            💳 PoolUp Debit Card
          </Text>
          {card ? (
            <View>
              <Text style={{ fontSize: 16, color: colors.text, marginBottom: 8 }}>
                Card ending in {card.cardNumber.slice(-4)}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                {card.cashbackRate}% cashback on all purchases
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Total Cashback: ${(card.stats.total_cashback_cents / 100).toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('DebitCard', { user, card })}>
                  <Text style={{ color: colors.blue, fontWeight: '600' }}>Manage →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                Get 2% cashback on all purchases and earn points for every transaction!
              </Text>
              <TouchableOpacity 
                onPress={createCard}
                style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Create Card</Text>
              </TouchableOpacity>
            </View>
          )}
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

        {/* Quick Actions */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Quick Actions
          </Text>
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
