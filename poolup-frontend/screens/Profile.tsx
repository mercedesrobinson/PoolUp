import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

function StatCard({ title, value, subtitle, color = colors.blue }) {
  return (
    <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, flex: 1, marginHorizontal: 4 }}>
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
      borderRadius: radius.medium, 
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

export default function Profile({ navigation, route }: any) {
  const routeUser = route?.params?.user;
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState([]);
  const [activeGoals, setActiveGoals] = useState<number>(0);
  const navUser = profile ? { id: profile.id, name: profile.name, email: profile.email } : routeUser;
  const [card, setCard] = useState({
    last_four: '4242',
    balance_cents: 15000,
    status: 'active'
  });

  const loadProfile = async () => {
    try {
      const userId = routeUser?.id;
      if (!userId) return;

      // Load profile from backend
      const userProfile = await api.getUserProfile(String(userId));
      setProfile({
        id: userId,
        name: userProfile?.name || routeUser?.name || 'User',
        email: userProfile?.email || routeUser?.email,
        xp: userProfile?.xp ?? 0,
        total_points: userProfile?.total_points ?? 0,
        current_streak: userProfile?.current_streak ?? 0,
        badge_count: userProfile?.badge_count ?? 0,
        avatar_type: userProfile?.avatar_type || 'default',
        avatar_data: userProfile?.avatar_data || null,
      });

      // Badges placeholder
      setBadges([]);

      // Count active goals using backend list
      const pools = await api.listPools(String(userId));
      setActiveGoals(Array.isArray(pools) ? pools.length : 0);
      
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Set default empty profile on error
      // Minimal offline fallback
      setProfile((prev: any) => prev || {
        name: routeUser?.name || 'User',
        email: routeUser?.email,
        xp: 0,
        total_points: 0,
        current_streak: 0,
        badge_count: 0,
        avatar_type: 'default',
        avatar_data: null,
      });
    }
  };

  const createCard = async () => {
    try {
      const newCard = await api.createDebitCard(navUser.id, navUser.name);
      setCard(newCard);
      Alert.alert('Success!', 'Your PoolUp debit card has been created! 🎉');
    } catch (error) {
      Alert.alert('Error', 'Failed to create debit card');
    }
  };

  useEffect(() => {
    loadProfile();
  }, [routeUser]);

  // Early return if no user data
  if (!profile && !routeUser) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFCFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Loading user data...</Text>
      </View>
    );
  }

  if (!profile) {
    // Show loading state with basic user info
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FAFCFF' }}>
        <View style={{ padding: 24, backgroundColor: colors.purple, paddingTop: 80 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32, color: 'white' }}>👤</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 8 }}>{profile?.name || 'User'}</Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>Level 1</Text>
          </View>
        </View>
        
        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, flex: 1, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.purple, textAlign: 'center' }}>0</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>Points</Text>
            </View>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, flex: 1, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.coral, textAlign: 'center' }}>0🔥</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>Streak</Text>
            </View>
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, flex: 1, marginHorizontal: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.green, textAlign: 'center' }}>0</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 4 }}>Badges</Text>
            </View>
          </View>
          
          <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Quick Actions</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("Pools" as any, { user: navUser })}
              style={{ backgroundColor: colors.green, padding: 12, borderRadius: radius.medium, marginBottom: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>View Pools</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate("CreatePool" as any, { user: navUser })}
              style={{ backgroundColor: colors.purple, padding: 12, borderRadius: radius.medium }}
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Settings" as any, { userId: user.id })}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarSection as any}>
          <View style={styles.avatar as any}>
            <Text style={styles.avatarText}>👤</Text>
            <TouchableOpacity style={styles.editBadge as any} onPress={() => navigation.navigate('ProfilePhotoUpload')}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName as any}>{profile?.name || 'User'}</Text>
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
          <StatCard title="Points" value={profile?.total_points || 0} subtitle="" color={colors.purple} />
          <StatCard title="Streak" value={`${profile?.current_streak || 0}🔥`} subtitle="days" color={colors.coral} />
          <StatCard title="Badges" value={profile?.badge_count || 0} subtitle="" color={colors.green} />
        </View>


        {/* Badges Section */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              🏆 Badges ({badges.length})
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Badges" as any, { user, badges })}>
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

      {/* Savings Summary */}
      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            💰 Savings Summary
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SavingsSummary" as any, { user: navUser })}>
            <Text style={{ color: colors.blue, fontWeight: '600' }}>View Details →</Text>
          </TouchableOpacity>
        </View>
        
        {/* Total Saved Card */}
        <View style={{ 
          backgroundColor: colors.primary, 
          padding: 16, 
          borderRadius: radius.medium, 
          marginBottom: 12,
          alignItems: 'center'
        }}>
          <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>Total Saved</Text>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '700' }}>$0.00</Text>
          <Text style={{ color: 'white', fontSize: 12, opacity: 0.8 }}>☕ 0 coffee runs</Text>
        </View>

        {/* Quick Stats Grid */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: radius.medium, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>🎯</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{activeGoals}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Active Goals</Text>
            </View>
          <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: radius.medium, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>🔥</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>0</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Day Streak</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: radius.medium, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>💪</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>0%</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Savings Rate</Text>
          </View>
        </View>
      </View>

      {/* Transaction History */}
      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            📊 Recent Activity
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("TransactionHistory" as any, { user: navUser })}>
            <Text style={{ color: colors.blue, fontWeight: '600' }}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        {/* Recent Transactions */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
            No recent activity. Start contributing to see transactions here! 💰
          </Text>
        </View>
      </View>  
        {/* Projection */}
        <View style={{ backgroundColor: colors.blue + '10', padding: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
            📈 12-Month Projection
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Start saving to see your projection here
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius.medium, marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate("CreatePool" as any, { user: navUser })} style={{ backgroundColor: colors.green, padding: 12, borderRadius: radius.medium, flex: 1, marginRight: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>New Pool</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SoloSavings')} style={{ backgroundColor: colors.blue, padding: 12, borderRadius: radius.medium, flex: 1, marginLeft: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>Solo Goal</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Settings" as any, { user: navUser })} style={{ backgroundColor: colors.gray, padding: 12, borderRadius: radius.medium, alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
