import * as SecureStore from 'expo-secure-store';

const USER_KEY = 'poolup_user';
const PLAID_TOKEN_KEY = 'poolup_plaid_token';

export type StoredUser = { accessToken: string; user: any };

export async function saveUser(data: StoredUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function getUser(): Promise<StoredUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // ignore
  }
}

export async function savePlaidToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PLAID_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export async function getPlaidToken(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(PLAID_TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

