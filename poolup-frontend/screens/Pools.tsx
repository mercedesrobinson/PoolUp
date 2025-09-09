import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';
import { PoolCardSkeleton } from '../components/LoadingSkeleton';
import { GoalCategoryBadge } from '../components/GoalCategories';

function PoolCard({ item, onPress }){
  // Handle pools without goals (open-ended saving)
  const hasGoal = item.goal_cents && item.goal_cents > 0;
  const pct = hasGoal ? Math.min(100, Math.round((item.saved_cents / item.goal_cents)*100)) : 0;
  
  // Calculate time to goal completion
  const getTimeToGoal = () => {
    if (!hasGoal || pct >= 100) return null;
    
    const remaining = item.goal_cents - item.saved_cents;
    const weeklyContribution = 5000; // $50/week estimate
    const weeksLeft = Math.ceil(remaining / weeklyContribution);
    
    if (weeksLeft <= 4) return `${weeksLeft} weeks left`;
    if (weeksLeft <= 52) return `${Math.ceil(weeksLeft / 4)} months left`;
    return `${Math.ceil(weeksLeft / 52)} years left`;
  };

  const getProgressColor = () => {
    if (pct >= 75) return '#34A853'; // Green
    if (pct >= 50) return '#FBBC04'; // Yellow
    if (pct >= 25) return '#FF6B35'; // Orange
    return colors.blue; // Blue
  };
  
  return (
    <TouchableOpacity onPress={onPress} style={{ 
      backgroundColor:'white', 
      marginBottom:12, 
      padding:16, 
      borderRadius: radius.medium,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ fontSize:18, fontWeight:'700', color: colors.text, flex: 1 }}>{item.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {item.category && <GoalCategoryBadge category={item.category} />}
          {item.destination && (
            <Text style={{ fontSize: 12, color: colors.blue, backgroundColor: colors.blue + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              🌍 {item.destination}
            </Text>
          )}
        </View>
      </View>
      
      {hasGoal && (
        <>
          <View style={{ height:12, backgroundColor:'#e6eef7', borderRadius:8, overflow:'hidden', marginTop:8 }}>
            <View style={{ 
              width:`${pct}%`, 
              backgroundColor: getProgressColor(), 
              height:'100%',
              borderRadius: 8
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <View>
              <Text style={{ color:'#556', fontSize: 14 }}>${(item.saved_cents/100).toFixed(2)} of ${(item.goal_cents/100).toFixed(2)}</Text>
              {getTimeToGoal() && (
                <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                  ⏰ {getTimeToGoal()}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: getProgressColor(), fontSize: 16, fontWeight: '700' }}>{pct}%</Text>
              {pct >= 100 && (
                <Text style={{ fontSize: 12, color: '#34A853' }}>🎉 Complete!</Text>
              )}
            </View>
          </View>
        </>
      )}
      
      {!hasGoal && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color:'#556', fontSize: 16, fontWeight: '600' }}>
            ${(item.saved_cents/100).toFixed(2)} saved
          </Text>
          <Text style={{ color: colors.green, fontSize: 12, marginTop: 2 }}>
            💰 Open savings pot
          </Text>
        </View>
      )}
      
      {item.bonus_pot_cents > 0 && (
        <Text style={{ color: colors.green, fontSize: 12, marginTop: 4 }}>
          🎁 Bonus: ${(item.bonus_pot_cents/100).toFixed(2)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function Pools({ navigation, route }: any){
  const [pools,setPools] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalSaved: 125000,
    activeGoals: 3,
    completedGoals: 2,
    currentStreak: 14,
    monthlyAverage: 35000,
    savingsRate: 0.23,
    nextMilestone: { amount: 150000, daysLeft: 12 }
  });
  const user = (route.params as any)?.user || { id: 1, name: 'Demo User' };

  const load = async () => {
    try {
      // Try real backend
      const list = await (api.getPools ? api.getPools() : api.listPools?.(String(user.id)))?.catch?.(() => null);
      if (Array.isArray(list) && list.length >= 0) {
        setPools(list as any);
        // Derive a basic summary from real data
        const totalSaved = list.reduce((sum: number, p: any) => sum + (p.saved_cents || 0), 0);
        setSummaryData((s) => ({ ...s, totalSaved }));
      } else {
        throw new Error('No pools');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Commented out mock fallback to use backend only
      // const mockPools = [ { id: 1, name: 'Demo Pool', goal_cents: 100000, saved_cents: 25000, destination: 'Sample', creator_id: user.id, bonus_pot_cents: 0 } ];
      // setPools(mockPools as any);
      setPools([] as any);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };
  
  useEffect(() => {
    load();
  }, []);
  
  useEffect(()=>{ const s = navigation.addListener('focus', load); return s; },[navigation]);
  
  // Listen for refresh parameter
  useEffect(() => {
    if ((route.params as any)?.refresh) {
      load();
    }
  }, [(route.params as any)?.refresh]);

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

  const mockSummary = summaryData || {
    totalSaved: 125000,
    activeGoals: 3,
    currentStreak: 14,
    savingsRate: 0.23
  };

  return (
    <ScrollView 
      style={{ flex:1, backgroundColor: '#FAFCFF' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Savings Summary Hero */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 30, paddingHorizontal: 24 }}>
        <Text style={{ color: 'white', fontSize: 16, opacity: 0.9, marginBottom: 8, textAlign: 'center' }}>
          Total Saved
        </Text>
        <Text style={{ color: 'white', fontSize: 48, fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>
          ${(mockSummary.totalSaved / 100).toFixed(2)}
        </Text>
        
        {(() => {
          const equivalent = getSavingsEquivalent(mockSummary.totalSaved);
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

      {/* Quick Stats */}
      <View style={{ paddingHorizontal: 20, marginTop: -20, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{
            backgroundColor: 'white',
            flex: 1,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🎯</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              {mockSummary.activeGoals}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Active Goals
            </Text>
          </View>

          <View style={{
            backgroundColor: 'white',
            flex: 1,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🔥</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              {mockSummary.currentStreak}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Day Streak
            </Text>
          </View>

          <View style={{
            backgroundColor: 'white',
            flex: 1,
            padding: 16,
            borderRadius: radius.medium,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>💪</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              {(mockSummary.savingsRate * 100).toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Savings Rate
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Quick Actions */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>Quick Actions</Text>
          <TouchableOpacity onPress={()=>navigation.navigate("Profile" as any, { user })} style={{ backgroundColor: colors.green, paddingVertical:8, paddingHorizontal:12, borderRadius:12 }}>
            <Text style={{ color:'white', fontWeight:'600', fontSize: 12 }}>👤 Profile</Text>
          </TouchableOpacity>
        </View>


        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
          <TouchableOpacity 
            onPress={()=>navigation.navigate("CreatePool" as any, { user })} 
            style={{ flex: 1, backgroundColor: colors.green, padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>🎯</Text>
            <Text style={{ color:'white', fontWeight:'600', fontSize: 16 }}>New Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={()=>navigation.navigate("SoloSavings" as any, { user })} 
            style={{ flex: 1, backgroundColor: colors.purple, padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>💰</Text>
            <Text style={{ color:'white', fontWeight:'600', fontSize: 16 }}>Friends Feed</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
          <TouchableOpacity 
            onPress={()=>navigation.navigate("Badges" as any, { user })} 
            style={{ flex: 1, backgroundColor: '#FF6B6B', padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>🏆</Text>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={()=>navigation.navigate("SavingsSummary" as any, { userId: user.id })} 
            style={{ flex: 1, backgroundColor: colors.coral, padding: 16, borderRadius: radius.medium, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, marginBottom: 4 }}>📊</Text>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Savings Summary</Text>
          </TouchableOpacity>
        </View>

        {/* Pools List */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Your Pools
          </Text>
          {loading ? (
            <>
              <PoolCardSkeleton />
              <PoolCardSkeleton />
            </>
          ) : pools.length > 0 ? (
            <FlatList 
              data={pools} 
              keyExtractor={i=>i.id} 
              renderItem={({item})=>(
                <PoolCard item={item} onPress={()=>navigation.navigate("PoolDetail" as any, { user, poolId: item.id })} />
              )}
              scrollEnabled={false}
            />
          ) : (
            <View style={{ backgroundColor: 'white', padding: 24, borderRadius: radius.medium, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                Ready to Start Saving?
              </Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 }}>
                Create your first pool and start earning points, badges, and rewards!
              </Text>
              <TouchableOpacity 
                onPress={()=>navigation.navigate("CreatePool" as any, { user })}
                style={{ backgroundColor: colors.purple, padding: 12, borderRadius: radius.medium, paddingHorizontal: 24 }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Create First Pool</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Group Activity */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>🔥 Group Activity</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("GroupActivity" as any, { user })}
              style={{ backgroundColor: colors.blue + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            >
              <Text style={{ color: colors.blue, fontSize: 14, fontWeight: '600' }}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius.medium + 4, marginBottom: 12, ...shadow }}>
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
          
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius.medium + 4, marginBottom: 12, ...shadow }}>
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
              borderRadius: radius.medium, 
              borderWidth: 1, 
              borderColor: colors.blue + '30',
              alignItems: 'center',
              marginTop: 8
            }}
            onPress={() => navigation.navigate("GroupActivity" as any, { user })}
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
    borderRadius: radius.medium,
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
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: radius.medium,
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
