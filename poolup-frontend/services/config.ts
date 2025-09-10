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
  const env = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (env) return env.replace(/\/$/, '');
  return deriveLanBase(portFallback);
}

export function getSocketUrl(portFallback: number = 3000): string {
  const env = (process.env.EXPO_PUBLIC_SERVER_URL || process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (env) return env.replace(/\/$/, '');
  return deriveLanBase(portFallback);
}

