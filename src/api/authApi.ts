import { apiClient, unwrapData } from './client';
import { AuthTokens, User } from '../types';

export const authApi = {
  async login(username: string, password: string): Promise<AuthTokens> {
    const res = await apiClient.post('/auth/login', { username, password });
    return unwrapData<AuthTokens>(res.data);
  },

  async me(): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return unwrapData<User>(res.data);
  },

  async logout(refreshToken?: string): Promise<{ success: boolean }> {
    try {
      const res = await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
      return unwrapData<{ success: boolean }>(res.data);
    } catch {
      return { success: true };
    }
  },
};
