import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
const themeColors = colors;
const themeRadius = radius;
const themeShadow = shadow;
import { api } from '../services/api';

const colors = themeColors || { bg: '#ffffff', text: '#111', gray: '#f1f5f9', blue: '#6C63FF' };
const radius = typeof themeRadius === 'number' ? themeRadius : 12;
const shadow = themeShadow || { shadowColor:'#000', shadowOpacity:0.08, shadowRadius:12, shadowOffset:{ width:0, height:4 }, elevation:3 };

export default function Onboarding({ navigation }){
  const [name, setName] = useState('Mercedes');

  const start = async ()=>{
    try {
      console.log('calling api.guest with', name);
      const user = await api.guest(name);       // ← uses your real API
      console.log('api.guest OK →', user);
      navigation.replace('Pools', { user });
    } catch (e) {
      console.error('api.guest failed:', e);
      Alert.alert('Sign-in error', String(e?.message || e));
      // Fallback navigation so you’re not stuck:
      navigation.replace('Pools', { user: { id:'guest', name } });
    }
  };

  return (
    <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:32, fontWeight:'800', color: colors.text, marginBottom:12 }}>PoolUp</Text>
      <Text style={{ fontSize:16, color:'#566', marginBottom:24, textAlign:'center' }}>Save together. Achieve together.</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#888"
        style={{ width:'100%', backgroundColor: colors.gray, borderRadius: radius, padding:16, marginBottom:12, color: colors.text }}
      />

      <TouchableOpacity
        onPress={start}
        style={{ width:'100%', backgroundColor: colors.blue, padding:16, borderRadius: radius, alignItems:'center', ...shadow }}
      >
        <Text style={{ color:'white', fontWeight:'700' }}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}
