import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';
import { listPutawayTasks } from '@/features/putaway/api/putaway-api';

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

export function normalizeWarehouseItem(item: any): WarehouseItem {
  if (!item) return item;
  const onHand =
    item.quantityOnHand ??
    item.onHandQuantity ??
    item.quantity ??
    item.totalQty ??
    item.totalQuantity ??
    0;
  const allocated = item.allocatedQty ?? item.allocatedQuantity ?? item.reservedQty ?? 0;
  const available =
    item.availableQty ??
    item.availableQuantity ??
    item.usableQty ??
    item.availableStock ??
    Math.max(0, onHand - allocated);

  const location =
    item.location ||
    item.locationCode ||
    item.locationName ||
    item.storageLocation ||
    item.defaultLocation ||
    item.binCode ||
    item.cellCode ||
    item.rackCode ||
    'Kho chính';

  return {
    ...item,
    id: String(item.id || item._id || item.itemId || item.sku || ''),
    sku: item.sku || item.code || item.itemSku || '',
    name: item.name || item.itemName || item.title || item.sku || '',
    quantityOnHand: onHand,
    availableQty: available,
    allocatedQty: allocated,
    location,
    barcode: item.barcode || item.barCode || item.upc || item.ean || '',
  };
}

export async function linkPutawayStockToItems(items: WarehouseItem[]): Promise<WarehouseItem[]> {
  try {
    const tasks = await listPutawayTasks({ status: 'ALL' }, true);
    if (!tasks || tasks.length === 0) return items;

    // Create lookup by SKU, Name, and Item ID
    const putawayMap = new Map<string, { doneQty: number; locations: Set<string> }>();

    const addRecord = (key: string | undefined | null, qty: number, shelfCode?: string | null) => {
      if (!key) return;
      const k = String(key).trim().toUpperCase();
      if (!k) return;
      if (!putawayMap.has(k)) {
        putawayMap.set(k, { doneQty: 0, locations: new Set() });
      }
      const record = putawayMap.get(k)!;
      record.doneQty += qty;
      if (shelfCode) {
        record.locations.add(shelfCode);
      }
    };

    tasks.forEach((task) => {
      (task.items || []).forEach((item) => {
        let putawayDone = 0;
        if (task.status === 'COMPLETED') {
          putawayDone = item.quantity || 0;
        } else {
          putawayDone = Math.max(0, (item.quantity || 0) - (item.remainingQty ?? item.quantity ?? 0));
        }

        if (putawayDone > 0) {
          addRecord(item.sku, putawayDone, item.shelfCode);
          addRecord(item.itemId, putawayDone, item.shelfCode);
          addRecord(item.itemName, putawayDone, item.shelfCode);
        }
      });
    });

    return items.map((item) => {
      const keysToTry = [item.sku, item.id, item.name].filter(Boolean).map((k) => String(k).trim().toUpperCase());

      let matched: { doneQty: number; locations: Set<string> } | undefined;
      for (const k of keysToTry) {
        if (putawayMap.has(k)) {
          matched = putawayMap.get(k);
          break;
        }
      }

      if (matched && matched.doneQty > 0) {
        const currentOnHand = item.quantityOnHand ?? 0;
        const currentAvailable = item.availableQty ?? 0;

        const finalOnHand = currentOnHand === 0 ? matched.doneQty : Math.max(currentOnHand, matched.doneQty);
        const finalAvailable = currentAvailable === 0 ? matched.doneQty : Math.max(currentAvailable, matched.doneQty);

        const locList = Array.from(matched.locations);
        const finalLocation = locList.length > 0
          ? locList.join(', ')
          : (!item.location || item.location === 'Kho chính')
          ? 'Khu vực cất hàng'
          : item.location;

        return {
          ...item,
          quantityOnHand: finalOnHand,
          availableQty: finalAvailable,
          location: finalLocation,
        };
      }
      return item;
    });
  } catch (err: any) {
    if (err?.response?.status !== 403 && err?.status !== 403) {
      console.warn('Lỗi tự động nối dữ liệu Cất hàng vào Sản phẩm:', err);
    }
    return items;
  }
}

export async function listProducts(forceRefresh = false): Promise<WarehouseItem[]> {
  const response = await cachedGet<ApiListResponse<WarehouseItem> | WarehouseItem[]>('/stock/items', undefined, { forceRefresh });
  const unwrapped = unwrapData<ApiListResponse<WarehouseItem> | WarehouseItem[]>(response.data);
  let list: any[] = [];
  if (Array.isArray(unwrapped)) {
    list = unwrapped;
  } else if (unwrapped && Array.isArray((unwrapped as ApiListResponse<WarehouseItem>).data)) {
    list = (unwrapped as ApiListResponse<WarehouseItem>).data;
  }
  const normalized = list.map(normalizeWarehouseItem);
  return linkPutawayStockToItems(normalized);
}

export async function getProductDetail(id: string): Promise<WarehouseItem> {
  const response = await cachedGet<WarehouseItem>(`/stock/items/${encodeURIComponent(id)}`);
  const unwrapped = unwrapData<WarehouseItem>(response.data);
  const normalized = normalizeWarehouseItem(unwrapped);
  const linkedList = await linkPutawayStockToItems([normalized]);
  return linkedList[0];
}
