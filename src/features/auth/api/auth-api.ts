import { apiClient, unwrapData } from '@/shared/lib/api-client';
import type { AuthTokens, User } from '@/shared/types/auth';

export const authApi = {
  async login(username: string, password: string): Promise<AuthTokens> {
    const response = await apiClient.post('/auth/login', { username, password });
    return unwrapData<AuthTokens>(response.data);
  },
  async me(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return unwrapData<User>(response.data);
  },
  async logout(refreshToken?: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
    } catch {
      // Local logout must still succeed when the server is unavailable.
    }
  },
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return unwrapData<{ success: boolean }>(response.data);
  },
};
