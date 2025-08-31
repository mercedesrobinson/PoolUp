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
  const [summaryData, setSummaryData] = useState(null);
  const user = route.params.user;

  const load = async () => {
    try {
      const data = await api.listPools(user.id);
      setPools(data);
      
      // Load savings summary data
      const summaryResponse = await api.getSavingsSummary(user.id, '6months');
      setSummaryData(summaryResponse.summary);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      
      // Mock savings summary
      setSummaryData({
        totalSaved: 125000,
        activeGoals: 3,
        completedGoals: 2,
        currentStreak: 14,
        monthlyAverage: 35000,
        savingsRate: 0.23,
        nextMilestone: { amount: 150000, daysLeft: 12 }
      });
    }
  };
  
  useEffect(() => {
    load();
  }, []);
  
  useEffect(()=>{ const s = navigation.addListener('focus', load); return s; },[navigation]);
  
  // Listen for refresh parameter
  useEffect(() => {
    if (route.params?.refresh) {
      load();
    }
  }, [route.params?.refresh]);

  const getSavingsEquivalent = (amount) => {
    const amountInDollars = amount / 100;
    const equivalents = [
      { threshold: 5000, text: `1 epic European adventure`, icon: '✈️' },
      { threshold: 3000, text: `${Math.floor(amountInDollars / 500)} round-trip flights to Japan`, icon: '🇯🇵' },
      { threshold: 2000, text: `${Math.floor(amountInDollars / 500)} round-trip flights to Mexico`, icon: '🇲🇽' },
      { threshold: 1000, text: `${Math.floor(amountInDollars / 200)} weekend getaways`, icon: '🏖️' },
      { threshold: 500, text: `${Math.floor(amountInDollars / 150)} concert tickets`, icon: '🎵' },
      { threshold: 200, text: `${Math.floor(amountInDollars / 50)} fancy dinners`, icon: '🍽️' },
      { threshold: 0, text: `${Math.floor(amountInDollars / 5)} coffee runs`, icon: '☕' }
    ];
    return equivalents.find(eq => amountInDollars >= eq.threshold) || equivalents[equivalents.length - 1];
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor: '#FAFCFF' }}>
      {/* Savings Summary Hero */}
      {summaryData && (
        <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 30, paddingHorizontal: 24 }}>
          <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginBottom: 8, textAlign: 'center' }}>
            Total Saved
          </Text>
          <Text style={{ color: 'white', fontSize: 48, fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>
            ${(summaryData.totalSaved / 100).toFixed(2)}
          </Text>
          
          {(() => {
            const equivalent = getSavingsEquivalent(summaryData.totalSaved);
            return (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center'
              }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>{equivalent.icon}</Text>
                <Text style={{ fontSize: 14, color: 'white', fontWeight: '600' }}>
                  {equivalent.text}
                </Text>
              </View>
            );
          })()}
        </View>
      )}

      {/* Quick Stats */}
      {summaryData && (
        <View style={{ paddingHorizontal: 20, marginTop: -20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{
              backgroundColor: 'white',
              flex: 1,
              padding: 16,
              borderRadius: radius,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🎯</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                {summaryData.activeGoals}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Active Goals
              </Text>
            </View>

            <View style={{
              backgroundColor: 'white',
              flex: 1,
              padding: 16,
              borderRadius: radius,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🔥</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                {summaryData.currentStreak}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Day Streak
              </Text>
            </View>

            <View style={{
              backgroundColor: 'white',
              flex: 1,
              padding: 16,
              borderRadius: radius,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>💪</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                {(summaryData.savingsRate * 100).toFixed(0)}%
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Savings Rate
              </Text>
            </View>
          </View>
        </View>
      )}
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
            style={{ flex: 1, backgroundColor: colors.green, padding: 16, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>🎯</Text>
            <Text style={{ color:'white', fontWeight:'700', fontSize: 16 }}>New Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={()=>navigation.navigate('SoloSavings', { user })} 
            style={{ flex: 1, backgroundColor: colors.purple, padding: 16, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>💰</Text>
            <Text style={{ color:'white', fontWeight:'700', fontSize: 16 }}>Solo Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
          <TouchableOpacity 
            onPress={()=>navigation.navigate('Badges', { user })} 
            style={{ flex: 1, backgroundColor: '#FF6B6B', padding: 16, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>🏆</Text>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={()=>navigation.navigate('SavingsSummary', { userId: user.id })} 
            style={{ flex: 1, backgroundColor: colors.coral, padding: 16, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>📊</Text>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>View Details</Text>
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
        
        {/* Group Activity */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>🔥 Group Activity</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('GroupActivity', { user })}
              style={{ backgroundColor: colors.blue + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            >
              <Text style={{ color: colors.blue, fontSize: 14, fontWeight: '600' }}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius + 4, marginBottom: 12, ...shadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 24, 
                backgroundColor: colors.green + '20', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Text style={{ fontSize: 20 }}>👩‍💻</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                  Sarah crushed it! 💪
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 2 }}>
                  Saved $150 in Tokyo Trip group
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>+$150</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 8 }}>2h ago</Text>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>🎉</Text>
              </View>
            </View>
          </View>
          
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius + 4, marginBottom: 12, ...shadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 24, 
                backgroundColor: colors.purple + '20', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Text style={{ fontSize: 20 }}>👨‍💻</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                  Mike hit a milestone! 🚀
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 2 }}>
                  Reached 50% in Tokyo Trip group
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.purple, fontWeight: '600' }}>50% Complete</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 8 }}>5h ago</Text>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={{ 
              backgroundColor: colors.blue + '10', 
              padding: 16, 
              borderRadius: radius, 
              borderWidth: 1, 
              borderColor: colors.blue + '30',
              alignItems: 'center',
              marginTop: 8
            }}
            onPress={() => navigation.navigate('GroupActivity', { user })}
          >
            <Text style={{ color: colors.blue, fontSize: 14, fontWeight: '600' }}>
              See more group activity 👥
            </Text>
          </TouchableOpacity>
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
