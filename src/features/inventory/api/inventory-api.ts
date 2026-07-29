import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';

export type StockCountStatus = 'DRAFT' | 'COUNTING' | 'WAITING_APPROVAL' | 'APPROVED' | 'CANCELLED';

export interface StockCount {
  id: string;
  countNumber?: string;
  status: StockCountStatus;
  notes?: string;
  items?: Array<{ itemId: string; sku: string; expectedQty?: number; actualQty?: number }>;
  createdAt?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listStockCounts(forceRefresh = false): Promise<StockCount[]> {
  const response = await cachedGet<ApiListResponse<StockCount> | StockCount[]>('/stock-counts', undefined, { forceRefresh });
  const unwrapped = unwrapData<ApiListResponse<StockCount> | StockCount[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<StockCount>).data)) {
    return (unwrapped as ApiListResponse<StockCount>).data;
  }
  return [];
}
