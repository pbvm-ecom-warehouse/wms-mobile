import axios, { create } from 'axios';
import { ENV } from '@/shared/config/env';
import { Storage } from './storage';

export const apiClient = create({
  baseURL: ENV.API_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': ENV.DEFAULT_TENANT_ID,
  },
});

export function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await Storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Tenant-ID'] = ENV.DEFAULT_TENANT_ID;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest?.url?.includes('/auth/login')) return Promise.reject(error);

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await Storage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${ENV.API_URL}/auth/refresh`,
            { refreshToken },
            { headers: { 'X-Tenant-ID': ENV.DEFAULT_TENANT_ID } },
          );
          const tokens = unwrapData<{ accessToken: string; refreshToken?: string }>(
            response.data,
          );
          await Storage.saveTokens(tokens.accessToken, tokens.refreshToken || refreshToken);
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        await Storage.clearAll();
      }
    }
    return Promise.reject(error);
  },
);
