import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import io from 'socket.io-client';

const SERVER = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

export default function PoolDetail({ navigation, route }){
  const { user, poolId } = route.params;
  const [pool, setPool] = useState(null);
  const [amount, setAmount] = useState('25');
  const [socket, setSocket] = useState(null);

  const load = async ()=>{
    const p = await api.getPool(poolId);
    setPool(p);
  };

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    const s = io(SERVER, { transports:['websocket'] });
    s.emit('room:join', poolId);
    s.on('contribution:new', (payload)=>{
      if(payload.poolId === poolId) load();
    });
    setSocket(s);
    return ()=> s.disconnect();
  },[]);

  if(!pool) return <View style={{flex:1}} />;

  const pct = Math.min(100, Math.round((pool.saved_cents / pool.goal_cents)*100));

  const contribute = async ()=>{
    await api.contribute(poolId, { userId: user.id, amountCents: Math.round(parseFloat(amount)*100) });
    setAmount('25');
  };

  return (
    <ScrollView style={{ flex:1, padding:24 }}>
      <Text style={{ fontSize:24, fontWeight:'800', color: colors.text }}>{pool.name}</Text>
      <View style={{ height:12, backgroundColor:'#e6eef7', borderRadius:8, overflow:'hidden', marginTop:12 }}>
        <View style={{ width:`${pct}%`, backgroundColor: colors.green, height:'100%' }} />
      </View>
      <Text style={{ marginTop:6, color:'#556' }}>${(pool.saved_cents/100).toFixed(2)} of ${(pool.goal_cents/100).toFixed(2)} • {pct}%</Text>

      <View style={{ marginTop:18, flexDirection:'row', gap:12, alignItems:'center' }}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ flex:1, backgroundColor:'#f5f7fb', padding:14, borderRadius:radius }} />
        <TouchableOpacity onPress={contribute} style={{ backgroundColor: colors.blue, paddingVertical:14, paddingHorizontal:18, borderRadius:radius }}>
          <Text style={{ color:'white', fontWeight:'700' }}>Contribute</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={()=>navigation.navigate('Chat', { user, poolId })} style={{ marginTop:18, backgroundColor: colors.coral, padding:14, borderRadius:radius, alignItems:'center' }}>
        <Text style={{ color:'white', fontWeight:'700' }}>Open Group Chat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
