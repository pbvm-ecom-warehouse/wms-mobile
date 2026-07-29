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

// RAM Cache Manager for Mobile Network Optimization
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30000; // 30 seconds

export function clearApiCache(urlPattern?: string) {
  if (!urlPattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(urlPattern)) {
      memoryCache.delete(key);
    }
  }
}

export async function cachedGet<T>(
  url: string,
  config?: any,
  options?: { ttl?: number; forceRefresh?: boolean },
): Promise<{ data: T }> {
  const cacheKey = `${url}:${JSON.stringify(config?.params || {})}`;
  const ttl = options?.ttl ?? DEFAULT_TTL;

  if (!options?.forceRefresh) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return { data: cached.data };
    }
  }

  const response = await apiClient.get<T>(url, config);
  memoryCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response;
}

export function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function formatApiError(error: any): string {
  if (!error) return 'Đã xảy ra lỗi không xác định.';
  if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
    return 'Lỗi kết nối mạng (Network Error). Vui lòng kiểm tra kết nối Wi-Fi/4G hoặc máy chủ WMS.';
  }
  const data = error?.response?.data;
  if (data) {
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join('\n');
    if (data.error?.message) return data.error.message;
    if (data.error?.code) return `Mã lỗi server: ${data.error.code}`;
  }
  return error?.message || 'Không thể kết nối đến máy chủ WMS.';
}

apiClient.interceptors.request.use(async (config) => {
  const token = await Storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Tenant-ID'] = ENV.DEFAULT_TENANT_ID;

  // Xóa Content-Type: application/json nếu gửi FormData để Axios / Native Bridge tự sinh multipart boundary
  if (
    config.data &&
    (config.data instanceof FormData ||
      (typeof config.data === 'object' && Array.isArray((config.data as any)._parts)))
  ) {
    delete config.headers['Content-Type'];
  }

  // Auto invalidate cache on mutations (POST, PUT, DELETE, PATCH)
  if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    clearApiCache();
  }

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
