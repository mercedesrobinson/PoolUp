import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

function PoolCard({ item, onPress }){
  const pct = Math.min(100, Math.round((item.saved_cents / item.goal_cents)*100));
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor:'white', marginBottom:12, padding:16, borderRadius: radius }}>
      <Text style={{ fontSize:18, fontWeight:'700', color: colors.text }}>{item.name}</Text>
      <View style={{ height:10, backgroundColor:'#e6eef7', borderRadius:8, overflow:'hidden', marginTop:8 }}>
        <View style={{ width:`${pct}%`, backgroundColor: colors.blue, height:'100%' }} />
      </View>
      <Text style={{ marginTop:6, color:'#556' }}>${(item.saved_cents/100).toFixed(2)} of ${(item.goal_cents/100).toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

export default function Pools({ navigation, route }){
  const [pools,setPools] = useState([]);
  const user = route.params.user;

  const load = async ()=>{
    const data = await api.listPools(user.id);
    setPools(data);
  };
  useEffect(()=>{ const s = navigation.addListener('focus', load); return s; },[navigation]);

  return (
    <View style={{ flex:1, padding:24, backgroundColor: '#FAFCFF' }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <Text style={{ fontSize:24, fontWeight:'800', color: colors.text }}>Your Pools</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('CreatePool', { user })} style={{ backgroundColor: colors.purple, paddingVertical:10, paddingHorizontal:14, borderRadius:12 }}>
          <Text style={{ color:'white', fontWeight:'700' }}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={pools} keyExtractor={i=>i.id} renderItem={({item})=>(
        <PoolCard item={item} onPress={()=>navigation.navigate('PoolDetail', { user, poolId: item.id })} />
      )} />
    </View>
  );
}
