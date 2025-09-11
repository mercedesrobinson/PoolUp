import { API_BASE, BASE_URL, request } from './client';

export const auth = {
  syncUserFromAuth: async (params: { name?: string; email: string; profile_image_url?: string }) => {
    const json = await request<any>(`${BASE_URL()}/auth/sync`, { method: 'POST', body: params });
    // Maintain legacy behavior: return the user object directly if wrapped
    return json?.user || json;
  },
  emailSignUp: async (name: string, email: string, password: string) => {
    return request(`${BASE_URL()}/auth/signup`, { method: 'POST', body: { name, email, password } });
  },
  emailLogin: async (email: string, password: string) => {
    return request(`${BASE_URL()}/auth/login`, { method: 'POST', body: { email, password } });
  },
  guest: async (name: string) => {
    return request(`${BASE_URL()}/auth/guest`, { method: 'POST', body: { name } });
  },
};
