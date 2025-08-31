import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

function PoolCard({ item, onPress }){
  const pct = Math.min(100, Math.round((item.saved_cents / item.goal_cents)*100));
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor:'white', marginBottom:12, padding:16, borderRadius: radius }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, flex: 1 }}>{item.name}</Text>
        {item.destination && (
          <Text style={{ fontSize: 12, color: colors.blue, backgroundColor: colors.blue + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
            🌍 {item.destination}
          </Text>
        )}
      </View>
      <View style={{ height:10, backgroundColor:'#e6eef7', borderRadius:8, overflow:'hidden', marginTop:8 }}>
        <View style={{ width:`${pct}%`, backgroundColor: colors.blue, height:'100%' }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <Text style={{ color:'#556' }}>${(item.saved_cents/100).toFixed(2)} of ${(item.goal_cents/100).toFixed(2)}</Text>
        <Text style={{ color: colors.purple, fontSize: 12, fontWeight: '600' }}>{pct}%</Text>
      </View>
      {item.bonus_pot_cents > 0 && (
        <Text style={{ color: colors.green, fontSize: 12, marginTop: 4 }}>
          🎁 Bonus: ${(item.bonus_pot_cents/100).toFixed(2)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function QuickStatsCard({ user, navigation }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getUserProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, [user.id]);

  if (!profile) return null;

  const level = Math.floor(profile.xp / 100) + 1;

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Profile', { user })}
      style={{ backgroundColor: colors.purple, padding: 16, borderRadius: radius, marginBottom: 16 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
            Hey {profile.name}! 👋
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 }}>
            Level {level} • {profile.total_points} points • {profile.current_streak}🔥 streak
          </Text>
        </View>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>View Profile →</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Pools({ navigation, route }){
  const [pools,setPools] = useState([]);
  const user = route.params.user;

  const load = async () => {
    try {
      const data = await api.listPools(user.id);
      setPools(data);
    } catch (error) {
      console.error('Failed to load pools:', error);
      // Mock data fallback for development
      setPools([
        {
          id: 1,
          name: "Tokyo Trip 2024",
          goal_cents: 300000,
          saved_cents: 75000,
          destination: "Tokyo, Japan",
          creator_id: user.id
        }
      ]);
    }
  };
  
  useEffect(() => {
    load();
  }, []);
  
  useEffect(()=>{ const s = navigation.addListener('focus', load); return s; },[navigation]);

  return (
    <ScrollView style={{ flex:1, backgroundColor: '#FAFCFF' }}>
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 20, paddingHorizontal: 24 }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>Your Pools</Text>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginTop: 4 }}>
          Track your savings progress
        </Text>
      </View>
      <View style={{ padding: 24 }}>
        {/* Quick Actions */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>Quick Actions</Text>
          <TouchableOpacity onPress={()=>navigation.navigate('Profile', { user })} style={{ backgroundColor: colors.green, paddingVertical:8, paddingHorizontal:12, borderRadius:12 }}>
            <Text style={{ color:'white', fontWeight:'600', fontSize: 12 }}>👤 Profile</Text>
          </TouchableOpacity>
        </View>


        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
          <TouchableOpacity 
            onPress={()=>navigation.navigate('CreatePool', { user })} 
            style={{ flex: 1, backgroundColor: colors.purple, padding: 14, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ color:'white', fontWeight:'700' }}>+ New Pool</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={()=>navigation.navigate('Badges', { user })} 
            style={{ flex: 1, backgroundColor: '#FF6B6B', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 }}
          >
            <Text style={{ color:'white', fontWeight:'700', fontSize: 16 }}>🏆 Badges</Text>
          </TouchableOpacity>
        </View>

        {/* Pools List */}
        {pools.length > 0 ? (
          <FlatList 
            data={pools} 
            keyExtractor={i=>i.id} 
            renderItem={({item})=>(
              <PoolCard item={item} onPress={()=>navigation.navigate('PoolDetail', { user, poolId: item.id })} />
            )}
            scrollEnabled={false}
          />
        ) : (
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
              Ready to Start Saving?
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 }}>
              Create your first pool and start earning points, badges, and rewards!
            </Text>
            <TouchableOpacity 
              onPress={()=>navigation.navigate('CreatePool', { user })}
              style={{ backgroundColor: colors.purple, padding: 12, borderRadius: radius, paddingHorizontal: 24 }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Create First Pool</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.profile?.level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔥 {user.profile?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.profile?.total_points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Profile', { userId: user.id })}
            >
              <Text style={styles.quickActionText}>👤 Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('SoloSavings', { userId: user.id })}
            >
              <Text style={styles.quickActionText}>🎯 Solo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('SocialFeed', { userId: user.id })}
            >
              <Text style={styles.quickActionText}>💬 Social</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickStats: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: radius,
    marginTop: 16,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blue,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.blue + '20',
    minHeight: 48,
    ...shadow,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
