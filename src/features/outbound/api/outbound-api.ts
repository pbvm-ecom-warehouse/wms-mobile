import { apiClient, unwrapData } from '@/shared/lib/api-client';

export type GoodsIssueStatus = 'DRAFT' | 'PICKING' | 'PACKING' | 'CONFIRMED' | 'SHIPPED';

export interface GoodsIssueLine {
  id: string;
  sku: string;
  itemName?: string;
  expectedQty: number;
  actualQty?: number;
  unit: string;
  picked?: boolean;
}

export interface GoodsIssue {
  id: string;
  issueNumber: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  status: GoodsIssueStatus;
  lines?: GoodsIssueLine[];
  createdAt?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listGoodsIssues(): Promise<GoodsIssue[]> {
  const response = await apiClient.get<ApiListResponse<GoodsIssue> | GoodsIssue[]>('/goods-issues');
  const unwrapped = unwrapData<ApiListResponse<GoodsIssue> | GoodsIssue[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<GoodsIssue>).data)) {
    return (unwrapped as ApiListResponse<GoodsIssue>).data;
  }
  return [];
}
