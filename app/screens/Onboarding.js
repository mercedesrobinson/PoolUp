import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

export default function Onboarding({ navigation }){
  const [name,setName] = useState('Mercedes');
  const start = async ()=>{
    const user = await api.guest(name);
    navigation.replace('Pools', { user });
  };
  return (
    <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:32, fontWeight:'800', color: colors.text, marginBottom:12 }}>PoolUp</Text>
      <Text style={{ fontSize:16, color:'#566', marginBottom:24, textAlign:'center' }}>Save together. Achieve together.</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Your name" 
        style={{ width:'100%', backgroundColor: colors.gray, borderRadius: radius, padding:16, marginBottom:12 }} />
      <TouchableOpacity onPress={start} style={{ width:'100%', backgroundColor: colors.blue, padding:16, borderRadius: radius, alignItems:'center', ...shadow }}>
        <Text style={{ color:'white', fontWeight:'700' }}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}
