import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';

export type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED';

export interface Shipment {
  id: string;
  trackingNumber?: string;
  shipmentNumber?: string;
  carrierName?: string;
  recipientName?: string;
  address?: string;
  status: ShipmentStatus;
  createdAt?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listShipments(forceRefresh = false): Promise<Shipment[]> {
  const response = await cachedGet<ApiListResponse<Shipment> | Shipment[]>('/shipments', undefined, { forceRefresh });
  const unwrapped = unwrapData<ApiListResponse<Shipment> | Shipment[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<Shipment>).data)) {
    return (unwrapped as ApiListResponse<Shipment>).data;
  }
  return [];
}
