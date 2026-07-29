import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';

export type PrintJobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PrintJob {
  id: string;
  jobId?: string;
  jobCode?: string;
  status: PrintJobStatus;
  templateName?: string;
  quantity?: number;
  completedQuantity?: number;
  createdAt?: string;
}

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listPrintJobs(forceRefresh = false): Promise<PrintJob[]> {
  const response = await cachedGet<ApiListResponse<PrintJob> | PrintJob[]>('/print-jobs', undefined, { forceRefresh });
  const unwrapped = unwrapData<ApiListResponse<PrintJob> | PrintJob[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<PrintJob>).data)) {
    return (unwrapped as ApiListResponse<PrintJob>).data;
  }
  return [];
}
