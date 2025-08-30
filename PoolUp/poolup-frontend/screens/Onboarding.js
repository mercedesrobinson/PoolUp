import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

export default function Onboarding({ navigation }){
  const [name,setName] = useState('');
  
  const startWithGuest = async ()=>{
    if(!name.trim()) return Alert.alert('Error', 'Please enter your name');
    try {
      const user = await api.guest(name.trim());
      navigation.replace('Pools', { user });
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Mock Google sign-in for now since we don't have backend
      const mockGoogleUser = {
        id: Date.now(),
        name: 'Google User',
        email: 'user@gmail.com',
        profileImage: null,
        authProvider: 'google'
      };
      navigation.replace('Pools', { user: mockGoogleUser });
    } catch (error) {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center', padding:24 }}>
      <Image 
        source={require('../assets/icon.png')} 
        style={{ width: 80, height: 80, marginBottom: 12 }} 
        resizeMode="contain"
      />
      <Text style={{ fontSize:32, fontWeight:'800', color: colors.text, marginBottom:12 }}>PoolUp</Text>
      <Text style={{ fontSize:16, color:'#566', marginBottom:32, textAlign:'center' }}>Your future, funded with friends.</Text>
      
      {/* Google Sign In */}
      <TouchableOpacity onPress={signInWithGoogle} style={{ 
        width:'100%', 
        backgroundColor: 'white', 
        padding:16, 
        borderRadius: radius, 
        alignItems:'center', 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        justifyContent: 'center',
        ...shadow 
      }}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
        <Text style={{ color: colors.text, fontWeight:'600', fontSize: 16 }}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
        <Text style={{ marginHorizontal: 16, color: '#666', fontSize: 14 }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
      </View>

      {/* Guest Sign Up */}
      <TextInput value={name} onChangeText={setName} placeholder="Enter your name" 
        style={{ width:'100%', backgroundColor: colors.gray, borderRadius: radius, padding:16, marginBottom:12, fontSize: 16 }} />
      <TouchableOpacity onPress={startWithGuest} style={{ width:'100%', backgroundColor: colors.blue, padding:16, borderRadius: radius, alignItems:'center', ...shadow }}>
        <Text style={{ color:'white', fontWeight:'700', fontSize: 16 }}>Get Started</Text>
      </TouchableOpacity>
      
      <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 16, paddingHorizontal: 20 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}
