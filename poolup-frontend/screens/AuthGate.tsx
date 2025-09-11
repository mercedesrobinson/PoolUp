import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

export default function AuthGate({ navigation }: any) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const supaUser = data.session?.user || null;
        if (supaUser) {
          // Ensure backend user exists and get backend id
          const backendUser = await api.syncUserFromAuth({ name: supaUser.user_metadata?.name, email: supaUser.email || '' });
          const merged = { id: String(backendUser.id), name: backendUser.name, email: backendUser.email, supaUserId: supaUser.id } as any;
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { user: merged } }] });
          return;
        }
      } catch (_) {}
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    })();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
