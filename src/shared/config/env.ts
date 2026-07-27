export const ENV = {
  API_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://api-ecom-wms.hoaiphuong.io.vn/api/wms',
  DEFAULT_TENANT_ID: process.env.EXPO_PUBLIC_TENANT_ID || 'demo-tenant',
  TIMEOUT: 15000,
} as const;
