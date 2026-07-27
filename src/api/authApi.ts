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

  async uploadAvatar(imageUri: string): Promise<User> {
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    const res = await apiClient.post('/auth/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return unwrapData<User>(res.data);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; mustChangePassword: boolean }> {
    const res = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return unwrapData<{ success: boolean; mustChangePassword: boolean }>(res.data);
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
