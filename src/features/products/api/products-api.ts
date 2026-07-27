import { apiClient, unwrapData } from '@/shared/lib/api-client';

export interface WarehouseItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  quantityOnHand?: number;
  availableQty?: number;
  allocatedQty?: number;
  location?: string;
  barcode?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listProducts(): Promise<WarehouseItem[]> {
  const response = await apiClient.get<ApiListResponse<WarehouseItem> | WarehouseItem[]>('/stock/items');
  const unwrapped = unwrapData<ApiListResponse<WarehouseItem> | WarehouseItem[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<WarehouseItem>).data)) {
    return (unwrapped as ApiListResponse<WarehouseItem>).data;
  }
  return [];
}
