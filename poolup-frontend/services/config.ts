import Constants from 'expo-constants';
import { Platform } from 'react-native';

function deriveLanBase(portFallback: number): string {
  // Try to infer LAN IP from Expo host URI
  const anyConst: any = Constants as any;
  const hostUri: string =
    anyConst?.expoConfig?.hostUri ||
    anyConst?.manifest2?.extra?.expoGo?.hostUri ||
    anyConst?.manifest?.hostUri ||
    '';
  const match = hostUri.match(/(\d+\.\d+\.\d+\.\d+)/);
  if (match && match[1]) {
    return `http://${match[1]}:${portFallback}`;
  }
  // Android emulator special localhost
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${portFallback}`;
  }
  return `http://localhost:${portFallback}`;
}

export function getBaseUrl(portFallback: number = 3000): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  const envPort = Number(process.env.EXPO_PUBLIC_API_PORT || '') || portFallback;
  if (envUrl) {
    const isLoopback = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(envUrl);
    // On native devices, ignore loopback addresses (not reachable from phone)
    if (Platform.OS !== 'web' && isLoopback) {
      return deriveLanBase(envPort);
    }
    return envUrl.replace(/\/$/, '');
  }
  return deriveLanBase(envPort);
}

export function getSocketUrl(portFallback: number = 3000): string {
  const envUrl = (process.env.EXPO_PUBLIC_SERVER_URL || process.env.EXPO_PUBLIC_API_URL || '').trim();
  const envPort = Number(process.env.EXPO_PUBLIC_API_PORT || '') || portFallback;
  if (envUrl) {
    const isLoopback = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(envUrl);
    if (Platform.OS !== 'web' && isLoopback) {
      return deriveLanBase(envPort);
    }
    return envUrl.replace(/\/$/, '');
  }
  return deriveLanBase(envPort);
}
