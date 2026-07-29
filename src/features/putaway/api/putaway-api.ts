import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';
import type { ConfirmPutawayLineInput, NavigationPath, PutawaySuggestionInput, PutawaySuggestionResponse, PutawayTask, QueryPutawayTasksInput } from '../types/putaway';
import { normalizeWarehouseLayout, type WarehouseLayout } from '../utils/warehouse-layout';

export type { WarehouseLayout, WarehouseLayoutAisle, WarehouseLayoutCanvas, WarehouseLayoutGate, WarehouseLayoutRack, WarehouseLayoutZone } from '../utils/warehouse-layout';

interface ApiListLike<T> {
  data?: T[];
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export type StorageCellContent = {
  id: string;
  sku: string;
  itemName: string;
  unit: string;
  quantity: number;
  lotNumber?: string | null;
  expiryDate?: string | null;
  packageWidthCm?: number | null;
  packageHeightCm?: number | null;
  packageDepthCm?: number | null;
  packageVolumeCm3Snapshot?: number | null;
};

export type StorageCellView = {
  id: string;
  rackId: string;
  shelfId?: string;
  level: number;
  bay: number;
  code: string;
  barcode?: string;
  status: 'ACTIVE' | 'BLOCKED';
  innerWidth?: number;
  innerHeight?: number;
  innerDepth?: number;
  usableVolumeCm3?: number;
  occupiedVolumeCm3?: number;
  fillPercent: number;
  contents: StorageCellContent[];
};

let putawayTasksCache: {
  data: PutawayTask[];
  timestamp: number;
  key: string;
} | null = null;

export function invalidatePutawayCache() {
  putawayTasksCache = null;
}

export async function listPutawayTasks(input: QueryPutawayTasksInput = {}, forceRefresh = false): Promise<PutawayTask[]> {
  const cacheKey = JSON.stringify(input);
  if (!forceRefresh && putawayTasksCache && putawayTasksCache.key === cacheKey && Date.now() - putawayTasksCache.timestamp < 30000) {
    return putawayTasksCache.data;
  }

  const response = await apiClient.get<ApiListLike<PutawayTask> | PutawayTask[]>('/putaway-tasks', {
    params: {
      limit: input.limit,
      page: input.page,
      status: input.status && input.status !== 'ALL' ? input.status : undefined,
      grnId: input.grnId,
    },
  });
  const unwrapped = unwrapData<ApiListLike<PutawayTask> | PutawayTask[]>(response.data);
  let result: PutawayTask[] = [];
  if (Array.isArray(unwrapped)) {
    result = unwrapped;
  } else if (unwrapped && Array.isArray((unwrapped as ApiListLike<PutawayTask>).data)) {
    result = (unwrapped as ApiListLike<PutawayTask>).data!;
  } else if (unwrapped && Array.isArray((unwrapped as ApiListLike<PutawayTask>).items)) {
    result = (unwrapped as ApiListLike<PutawayTask>).items!;
  }

  putawayTasksCache = { data: result, timestamp: Date.now(), key: cacheKey };
  return result;
}

export async function getPutawayTask(id: string): Promise<PutawayTask> {
  const response = await cachedGet<PutawayTask>(`/putaway-tasks/${encodeURIComponent(id)}`);
  return unwrapData<PutawayTask>(response.data);
}

export async function confirmPutawayLine(taskId: string, input: ConfirmPutawayLineInput): Promise<PutawayTask> {
  invalidatePutawayCache();
  const payload: any = {
    itemBarcode: input.itemBarcode,
    cellBarcode: input.cellBarcode || input.shelfCode,
    shelfCode: input.shelfCode || input.cellBarcode,
    quantity: Math.max(1, Number(input.quantity) || 1),
  };
  if (input.suggestedCellId) payload.suggestedCellId = input.suggestedCellId;
  if (input.lotId) payload.lotId = input.lotId;

  const response = await apiClient.post<PutawayTask>(`/putaway-tasks/${encodeURIComponent(taskId)}/confirm-line`, payload);
  return unwrapData<PutawayTask>(response.data);
}

export async function getPutawaySuggestions(input: PutawaySuggestionInput): Promise<PutawaySuggestionResponse> {
  const cleanSku = (input.sku || '').trim();
  if (!cleanSku) {
    return { suggestions: [], warning: 'ITEM_NO_DIMENSIONS' };
  }

  const params: Record<string, any> = {
    sku: cleanSku,
    qty: Math.max(1, Number(input.packageCount) || 1),
  };

  if (input.lotId?.trim()) {
    params.lotId = input.lotId.trim();
  }

  if (input.packageSpec) {
    if (Number.isFinite(input.packageSpec.volumeCm3) && input.packageSpec.volumeCm3 > 0) {
      params.packageVolumeCm3 = input.packageSpec.volumeCm3;
    }
    if (Number.isFinite(input.packageSpec.depthCm) && input.packageSpec.depthCm > 0) {
      params.packageDepthCm = input.packageSpec.depthCm;
    }
    if (Number.isFinite(input.packageSpec.widthCm) && input.packageSpec.widthCm > 0) {
      params.packageWidthCm = input.packageSpec.widthCm;
    }
    if (Number.isFinite(input.packageSpec.heightCm) && input.packageSpec.heightCm > 0) {
      params.packageHeightCm = input.packageSpec.heightCm;
    }
  }

  try {
    const response = await cachedGet<PutawaySuggestionResponse>('/putaway/suggestions', { params });
    return unwrapData<PutawaySuggestionResponse>(response.data);
  } catch {
    return { suggestions: [], warning: 'NO_SHELF_FITS' };
  }
}

export async function fetchWarehouseLayout(): Promise<WarehouseLayout> {
  try {
    const response = await cachedGet<unknown>('/location/layout');
    return normalizeWarehouseLayout(response.data);
  } catch (err) {
    console.warn('Lỗi tải sơ đồ /location/layout từ backend:', err);
    return normalizeWarehouseLayout({});
  }
}

export async function listRackCells(rackId: string): Promise<StorageCellView[]> {
  if (!rackId) return [];
  try {
    const response = await cachedGet<any>(`/location/racks/${encodeURIComponent(rackId)}/cells`);
    const payload = unwrapData<any>(response.data);
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    return list;
  } catch (err) {
    console.warn(`Lỗi tải /location/racks/${rackId}/cells:`, err);
    return [];
  }
}

export async function getNavigationPath(targetRackId: string): Promise<NavigationPath | null> {
  try {
    const response = await cachedGet<NavigationPath>('/location/navigation', {
      params: { targetRackId },
    });
    return unwrapData<NavigationPath>(response.data);
  } catch (err) {
    console.warn('Lỗi gọi API getNavigationPath:', err);
    return null;
  }
}

export const listPutawaySuggestionResult = getPutawaySuggestions;
