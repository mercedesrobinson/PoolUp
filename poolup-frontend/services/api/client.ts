import { getBaseUrl } from '../config';

// Shared API client utilities
export const BASE_URL = () => getBaseUrl(3000);
export const API_BASE = () => `${BASE_URL()}/api`;

// Development fallback for x-user-id header
export const getCurrentUserId = (): string => '1756612920173';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function request<T = any>(
  path: string,
  options: { method?: Method; headers?: Record<string, string>; body?: any } = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const json = text ? JSON.parse(text) : {};
      errMsg = json?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

