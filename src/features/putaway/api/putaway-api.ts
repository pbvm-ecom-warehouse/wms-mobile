import { apiClient, unwrapData } from '@/shared/lib/api-client';
import type {
  ConfirmPutawayLineInput,
  PutawaySuggestionInput,
  PutawaySuggestionResponse,
  PutawayTask,
  QueryPutawayTasksInput,
} from '../types/putaway';

interface ApiListLike<T> {
  data?: T[];
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export async function listPutawayTasks(input: QueryPutawayTasksInput = {}): Promise<PutawayTask[]> {
  const response = await apiClient.get<ApiListLike<PutawayTask> | PutawayTask[]>('/putaway-tasks', {
    params: {
      limit: input.limit,
      page: input.page,
      status: input.status && input.status !== 'ALL' ? input.status : undefined,
      grnId: input.grnId,
    },
  });
  const unwrapped = unwrapData<ApiListLike<PutawayTask> | PutawayTask[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListLike<PutawayTask>).data)) {
    return (unwrapped as ApiListLike<PutawayTask>).data!;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListLike<PutawayTask>).items)) {
    return (unwrapped as ApiListLike<PutawayTask>).items!;
  }
  return [];
}

export async function getPutawayTask(id: string): Promise<PutawayTask> {
  const response = await apiClient.get<PutawayTask>(`/putaway-tasks/${encodeURIComponent(id)}`);
  return unwrapData<PutawayTask>(response.data);
}

export async function confirmPutawayLine(
  taskId: string,
  input: ConfirmPutawayLineInput,
): Promise<PutawayTask> {
  const response = await apiClient.post<PutawayTask>(
    `/putaway-tasks/${encodeURIComponent(taskId)}/confirm-line`,
    input,
  );
  return unwrapData<PutawayTask>(response.data);
}

export async function getPutawaySuggestions(
  input: PutawaySuggestionInput,
): Promise<PutawaySuggestionResponse> {
  const response = await apiClient.get<PutawaySuggestionResponse>('/putaway/suggestions', {
    params: {
      sku: input.sku,
      qty: input.quantity,
    },
  });
  return unwrapData<PutawaySuggestionResponse>(response.data);
}
