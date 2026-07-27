import { apiClient, unwrapData } from '@/shared/lib/api-client';

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

export async function listShipments(): Promise<Shipment[]> {
  const response = await apiClient.get<ApiListResponse<Shipment> | Shipment[]>('/shipments');
  const unwrapped = unwrapData<ApiListResponse<Shipment> | Shipment[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<Shipment>).data)) {
    return (unwrapped as ApiListResponse<Shipment>).data;
  }
  return [];
}
