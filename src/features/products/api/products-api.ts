import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';

export interface WarehouseItem {
  id: string;
  sku: string;
  name: string;
  type?: string;
  unit?: string;
  quantityOnHand?: number;
  availableQty?: number;
  allocatedQty?: number;
  location?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  supplierName?: string;
  supplierCode?: string;
  lotNumber?: string;
  expiryDate?: string;
  description?: string;
  category?: string;
  categoryName?: string;
  price?: number;
  status?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listProducts(forceRefresh = false): Promise<WarehouseItem[]> {
  const response = await cachedGet<ApiListResponse<WarehouseItem> | WarehouseItem[]>('/stock/items', undefined, { forceRefresh });
  const unwrapped = unwrapData<ApiListResponse<WarehouseItem> | WarehouseItem[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<WarehouseItem>).data)) {
    return (unwrapped as ApiListResponse<WarehouseItem>).data;
  }
  return [];
}

export async function getProductDetail(id: string): Promise<WarehouseItem> {
  const response = await cachedGet<WarehouseItem>(`/stock/items/${encodeURIComponent(id)}`);
  return unwrapData<WarehouseItem>(response.data);
}
