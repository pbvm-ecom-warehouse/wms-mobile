import axios from 'axios';
import { ENV } from '../config/env';
import { Storage } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': ENV.DEFAULT_TENANT_ID,
  },
});

export function unwrapData<T>(responsePayload: any): T {
  if (responsePayload && typeof responsePayload === 'object' && 'data' in responsePayload) {
    return responsePayload.data as T;
  }
  return responsePayload as T;
}

apiClient.interceptors.request.use(
  async (config) => {
    const token = await Storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Tenant-ID'] = ENV.DEFAULT_TENANT_ID;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await Storage.getRefreshToken();
        if (refreshToken) {
          const res = await axios.post(
            `${ENV.API_URL}/auth/refresh`,
            { refreshToken },
            { headers: { 'X-Tenant-ID': ENV.DEFAULT_TENANT_ID } }
          );
          const data = unwrapData<{ accessToken: string; refreshToken?: string }>(res.data);
          await Storage.saveTokens(data.accessToken, data.refreshToken || refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        await Storage.clearAll();
      }
    }
    return Promise.reject(error);
  }
);
