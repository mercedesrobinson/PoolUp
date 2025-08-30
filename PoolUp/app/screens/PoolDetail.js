import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import io from 'socket.io-client';

const SERVER = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

function MemberCard({ member, onPeerBoost, currentUserId }) {
  return (
    <View style={{ backgroundColor: 'white', padding: 12, borderRadius: radius, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          {member.name} {member.id === currentUserId && '(You)'}
        </Text>
        {member.id !== currentUserId && (
          <TouchableOpacity 
            onPress={() => onPeerBoost(member.id)}
            style={{ backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>🤝 Boost</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ContributionItem({ contribution, members }) {
  const member = members.find(m => m.id === contribution.user_id);
  const hasBonus = contribution.points_earned > 0 || contribution.streak_bonus;
  
  return (
    <View style={{ backgroundColor: 'white', padding: 12, borderRadius: radius, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {member?.name || 'Unknown'}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {new Date(contribution.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.green }}>
            +${(contribution.amount_cents / 100).toFixed(2)}
          </Text>
          {hasBonus && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              {contribution.streak_bonus && <Text style={{ fontSize: 12, color: colors.coral, marginRight: 8 }}>🔥</Text>}
              {contribution.points_earned > 0 && (
                <Text style={{ fontSize: 12, color: colors.purple }}>+{contribution.points_earned} pts</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function PoolDetail({ navigation, route }){
  const { user, poolId } = route.params;
  const [pool, setPool] = useState(null);
  const [amount, setAmount] = useState('25');
  const [socket, setSocket] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('manual');

  const load = async ()=>{
    const p = await api.getPool(poolId);
    setPool(p);
  };

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    const s = io(SERVER, { transports:['websocket'] });
    s.emit('room:join', poolId);
    s.on('contribution:new', (payload)=>{
      if(payload.poolId === poolId) {
        load();
        if(payload.newBadges && payload.newBadges.length > 0) {
          Alert.alert('New Badge Earned! 🏆', `You earned: ${payload.newBadges[0].name}`);
        }
      }
    });
    s.on('peer_boost:new', (payload) => {
      if(payload.poolId === poolId) {
        load();
        Alert.alert('Peer Boost! 🤝', 'Someone helped cover a payment!');
      }
    });
    setSocket(s);
    return ()=> s.disconnect();
  },[]);

  if(!pool) return <View style={{flex:1, backgroundColor: '#FAFCFF'}} />;

  const pct = Math.min(100, Math.round((pool.saved_cents / pool.goal_cents)*100));

  const contribute = async ()=>{
    try {
      const result = await api.contribute(poolId, { 
        userId: user.id, 
        amountCents: Math.round(parseFloat(amount)*100),
        paymentMethod 
      });
      setAmount('25');
      
      let message = `Contribution successful! +${result.points} points`;
      if (result.streak > 1) message += `\n🔥 ${result.streak} day streak!`;
      if (result.newBadges && result.newBadges.length > 0) {
        message += `\n🏆 New badge: ${result.newBadges[0].name}`;
      }
      Alert.alert('Success!', message);
    } catch (error) {
      Alert.alert('Error', 'Failed to process contribution');
    }
  };

  const handlePeerBoost = async (targetUserId) => {
    Alert.alert(
      'Peer Boost 🤝',
      'Cover someone\'s missed payment and earn bonus points!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Help ($25)', onPress: () => peerBoost(targetUserId, 2500) }
      ]
    );
  };

  const peerBoost = async (targetUserId, amountCents) => {
    try {
      const result = await api.peerBoost(poolId, user.id, targetUserId, amountCents);
      Alert.alert('Peer Boost Complete! 🎉', `You earned ${result.points} bonus points for helping!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to process peer boost');
    }
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor: '#FAFCFF' }}>
      <View style={{ padding: 24 }}>
        {/* Pool Header */}
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: radius, marginBottom: 16 }}>
          <Text style={{ fontSize:24, fontWeight:'800', color: colors.text }}>{pool.name}</Text>
          {pool.destination && (
            <Text style={{ fontSize: 16, color: colors.blue, marginTop: 4 }}>🌍 {pool.destination}</Text>
          )}
          {pool.trip_date && (
            <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>📅 {pool.trip_date}</Text>
          )}
          
          <View style={{ height:12, backgroundColor:'#e6eef7', borderRadius:8, overflow:'hidden', marginTop:12 }}>
            <View style={{ width:`${pct}%`, backgroundColor: colors.green, height:'100%' }} />
          </View>
          <Text style={{ marginTop:6, color:'#556' }}>
            ${(pool.saved_cents/100).toFixed(2)} of ${(pool.goal_cents/100).toFixed(2)} • {pct}%
          </Text>
          
          {pool.bonus_pot_cents > 0 && (
            <Text style={{ marginTop: 8, color: colors.purple, fontWeight: '600' }}>
              🎁 Bonus Pot: ${(pool.bonus_pot_cents/100).toFixed(2)}
            </Text>
          )}
        </View>

        {/* Contribution Section */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            💰 Make Contribution
          </Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <TouchableOpacity 
              onPress={() => setPaymentMethod('manual')}
              style={{ 
                flex: 1, 
                backgroundColor: paymentMethod === 'manual' ? colors.blue : '#f0f0f0',
                padding: 12, 
                borderRadius: radius, 
                marginRight: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: paymentMethod === 'manual' ? 'white' : colors.text, fontWeight: '600' }}>
                Manual
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setPaymentMethod('debit_card')}
              style={{ 
                flex: 1, 
                backgroundColor: paymentMethod === 'debit_card' ? colors.blue : '#f0f0f0',
                padding: 12, 
                borderRadius: radius, 
                marginLeft: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: paymentMethod === 'debit_card' ? 'white' : colors.text, fontWeight: '600' }}>
                💳 Card
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection:'row', gap:12, alignItems:'center' }}>
            <TextInput 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric" 
              style={{ flex:1, backgroundColor:'#f5f7fb', padding:14, borderRadius:radius }} 
              placeholder="25"
            />
            <TouchableOpacity onPress={contribute} style={{ backgroundColor: colors.blue, paddingVertical:14, paddingHorizontal:18, borderRadius:radius }}>
              <Text style={{ color:'white', fontWeight:'700' }}>Contribute</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>
            💡 Contribute early in the week for bonus points!
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Leaderboard', { user, poolId, poolName: pool.name })} 
            style={{ flex: 1, backgroundColor: colors.purple, padding: 14, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>🏆 Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Chat', { user, poolId })} 
            style={{ flex: 1, backgroundColor: colors.coral, padding: 14, borderRadius: radius, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>💬 Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Pool Members */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            👥 Members ({pool.members?.length || 0})
          </Text>
          {pool.members?.map(member => (
            <MemberCard 
              key={member.id} 
              member={member} 
              onPeerBoost={handlePeerBoost}
              currentUserId={user.id}
            />
          ))}
        </View>

        {/* Recent Contributions */}
        <View style={{ backgroundColor: 'white', padding: 16, borderRadius: radius }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            📈 Recent Activity
          </Text>
          {pool.contributions && pool.contributions.length > 0 ? (
            <FlatList
              data={pool.contributions.slice(0, 5)}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ContributionItem contribution={item} members={pool.members} />}
              scrollEnabled={false}
            />
          ) : (
            <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>
              No contributions yet. Be the first to contribute! 🎯
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
