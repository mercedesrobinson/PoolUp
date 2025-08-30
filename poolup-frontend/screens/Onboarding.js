import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';
import authService from '../services/auth';

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
      // For development, simulate Google sign-in since we need real OAuth setup
      Alert.alert(
        'Google Sign-In',
        'Google OAuth requires setup with real credentials. For now, this will create a demo Google user.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue with Demo', 
            onPress: async () => {
              try {
                const demoUser = {
                  id: 'google_' + Date.now(),
                  name: 'Demo Google User',
                  email: 'demo@gmail.com',
                  photo: 'https://via.placeholder.com/150',
                  authProvider: 'google'
                };
                
                const response = await api.createGoogleUser(demoUser);
                navigation.replace('Pools', { user: response });
              } catch (error) {
                Alert.alert('Error', 'Failed to create demo user');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', error.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center', padding:24 }}>
      {/* PoolUp Logo */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <View style={{ 
          width: 120, 
          height: 120, 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16,
          position: 'relative'
        }}>
          {/* First circle (top-left) */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.green,
            position: 'absolute',
            top: 0,
            left: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4
          }} />
          {/* Second circle (bottom-right) */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.green,
            position: 'absolute',
            bottom: 0,
            right: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4
          }} />
        </View>
        <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', fontWeight: '500' }}>Your future, funded with friends.</Text>
      </View>
      
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
