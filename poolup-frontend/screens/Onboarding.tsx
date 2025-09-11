import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { colors, radius, shadow } from '../theme';
import { saveUser } from '../services/secureStorage';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

export default function Onboarding({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const goToMain = (user: any) => {
    try {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { user } }] });
    } catch (e) {
      try {
        navigation.replace('MainTabs', { user });
      } catch (_) {
        navigation.navigate('MainTabs' as any, { user });
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter both email and password');
    }
    if (isSignUp && !name.trim()) {
      return Alert.alert('Error', 'Please enter your name');
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        const accessToken = data.session?.access_token || '';
        const supaUser = data.user || null;
        if (!supaUser) throw new Error('Signup succeeded, but no user returned');
        // Sync into backend and use backend user id for the app
        const backendUser = await api.syncUserFromAuth({ name: name.trim(), email: supaUser.email || '' });
        const merged = { id: String(backendUser.id), name: backendUser.name, email: backendUser.email, supaUserId: supaUser.id } as any;
        await saveUser({ accessToken, user: merged });
        goToMain({ ...merged, authProvider: 'email' });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        const accessToken = data.session?.access_token || '';
        const supaUser = data.user || null;
        if (!supaUser) throw new Error('Login succeeded, but no user returned');
        const backendUser = await api.syncUserFromAuth({ name: name.trim() || undefined, email: supaUser.email || '' });
        const merged = { id: String(backendUser.id), name: backendUser.name, email: backendUser.email, supaUserId: supaUser.id } as any;
        await saveUser({ accessToken, user: merged });
        goToMain({ ...merged, authProvider: 'email' });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google login removed

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* PoolUp Logo */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <Image
          source={require('../assets/icon.png')}
          style={{
            width: 300,
            height: 200,
            marginBottom: 16,
            resizeMode: 'contain',
          }}
        />
      </View>

      {/* Google login removed */}

      {/* Email Authentication */}
      {isSignUp && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder='Enter your name'
          style={{
            width: '100%',
            backgroundColor: colors.gray,
            borderRadius: radius.medium,
            padding: 16,
            marginBottom: 12,
            fontSize: 16,
          }}
        />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder='Email address'
        keyboardType='email-address'
        autoCapitalize='none'
        style={{
          width: '100%',
          backgroundColor: colors.gray,
          borderRadius: radius.medium,
          padding: 16,
          marginBottom: 12,
          fontSize: 16,
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder='Password'
        secureTextEntry
        style={{
          width: '100%',
          backgroundColor: colors.gray,
          borderRadius: radius.medium,
          padding: 16,
          marginBottom: 16,
          fontSize: 16,
        }}
      />

      <TouchableOpacity
        onPress={handleEmailAuth}
        style={{
          width: '100%',
          backgroundColor: colors.primary,
          padding: 16,
          borderRadius: radius.medium,
          alignItems: 'center',
          marginBottom: 12,
          ...shadow,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
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
