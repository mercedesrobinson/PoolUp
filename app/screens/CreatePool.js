import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';

export default function CreatePool({ navigation, route }){
  const user = route.params.user;
  const [name,setName] = useState('Miami Trip');
  const [goal,setGoal] = useState('1500');

  const create = async ()=>{
    const pool = await api.createPool({ ownerId: user.id, name, goalCents: Math.round(parseFloat(goal)*100) });
    navigation.replace('PoolDetail', { user, poolId: pool.id });
  };

  return (
    <View style={{ flex:1, padding:24, gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:'800', color: colors.text }}>Create a Savings Pool</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Pool name" style={{ backgroundColor:'#f5f7fb', padding:16, borderRadius:radius }} />
      <TextInput value={goal} onChangeText={setGoal} keyboardType="numeric" placeholder="Goal ($)" style={{ backgroundColor:'#f5f7fb', padding:16, borderRadius:radius }} />
      <TouchableOpacity onPress={create} style={{ backgroundColor: colors.green, padding:16, borderRadius:radius, alignItems:'center' }}>
        <Text style={{ color:'white', fontWeight:'700' }}>Create</Text>
      </TouchableOpacity>
    </View>
  );
}
