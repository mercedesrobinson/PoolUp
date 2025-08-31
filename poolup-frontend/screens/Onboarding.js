import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { api } from '../services/api';

export default function Onboarding({ navigation }){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter both email and password');
    }
    if (isSignUp && !name.trim()) {
      return Alert.alert('Error', 'Please enter your name');
    }
    
    try {
      let user;
      if (isSignUp) {
        // Create new account
        user = { id: Date.now(), name: name.trim(), email: email.trim(), authProvider: 'email' };
      } else {
        // Sign in existing user
        user = { id: Date.now(), name: 'Returning User', email: email.trim(), authProvider: 'email' };
      }
      navigation.replace('Pools', { user });
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
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
        <Image 
          source={require('../assets/icon.png')}
          style={{ 
            width: 300, 
            height: 200, 
            marginBottom: 16,
            resizeMode: 'contain'
          }}
        />
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

      {/* Email Authentication */}
      {isSignUp && (
        <TextInput 
          value={name} 
          onChangeText={setName} 
          placeholder="Enter your name" 
          style={{ width:'100%', backgroundColor: colors.gray, borderRadius: radius, padding:16, marginBottom:12, fontSize: 16 }} 
        />
      )}
      <TextInput 
        value={email}
        onChangeText={setEmail}
        placeholder="Email address" 
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ width:'100%', backgroundColor: colors.gray, borderRadius: radius, padding:16, marginBottom:12, fontSize: 16 }} 
      />
      <TextInput 
        value={password}
        onChangeText={setPassword}
        placeholder="Password" 
        secureTextEntry
        style={{ width:'100%', backgroundColor: colors.gray, borderRadius: radius, padding:16, marginBottom:16, fontSize: 16 }} 
      />
      
      <TouchableOpacity onPress={handleEmailAuth} style={{ width:'100%', backgroundColor: colors.primary, padding:16, borderRadius: radius, alignItems:'center', marginBottom: 12, ...shadow }}>
        <Text style={{ color:'white', fontWeight:'700', fontSize: 16 }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.primary, fontSize: 14 }}>
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>
      
      <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 16, paddingHorizontal: 20 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}
