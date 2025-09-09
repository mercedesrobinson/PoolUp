import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Keychain from 'react-native-keychain';

export default function AuthGate({ navigation }: any) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const creds = await Keychain.getInternetCredentials('poolup_user');
        if (!mounted) return;
        if (creds && creds.password) {
          try {
            const parsed = JSON.parse(creds.password);
            const user = parsed?.user || null;
            if (user) {
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { user } }] });
              return;
            }
          } catch (_) {}
        }
      } catch (_) {}
      // Fallback to onboarding
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

