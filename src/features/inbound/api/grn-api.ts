import { Platform } from 'react-native';
import { ENV } from '@/shared/config/env';
import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';
import { Storage } from '@/shared/lib/storage';
import type {
  CreateGoodsReceiptNoteInput,
  CreateGoodsReceiptNoteItemInput,
  GoodsReceiptNote,
  PurchaseOrderItem,
  PurchaseOrderSummary,
  QueryGoodsReceiptNotesInput,
} from '../types/grn';

interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

function appendFileToFormData(formData: FormData, uri: string, fieldName = 'images') {
  if (!uri || typeof uri !== 'string') return;
  const cleanUri = uri.trim();
  let filename = cleanUri.split('?')[0].split('/').pop() || 'grn_evidence.jpg';
  if (!filename.includes('.')) {
    filename += '.jpg';
  }
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === 'png') mimeType = 'image/png';
  else if (ext === 'webp') mimeType = 'image/webp';
  else if (ext === 'heic' || ext === 'heif') mimeType = 'image/heic';

  const filePart = {
    uri: cleanUri,
    name: String(filename),
    type: String(mimeType),
  };

  // @ts-ignore React Native FormData file part structure
  formData.append(fieldName, filePart);
}

let grnCache: { data: GoodsReceiptNote[]; timestamp: number; key: string } | null = null;

export async function listGoodsReceiptNotes(
  input: QueryGoodsReceiptNotesInput = {},
  forceRefresh = false,
): Promise<GoodsReceiptNote[]> {
  const cacheKey = JSON.stringify(input);
  if (!forceRefresh && grnCache && grnCache.key === cacheKey && Date.now() - grnCache.timestamp < 45000) {
    return grnCache.data;
  }

  const response = await apiClient.get<ApiListResponse<GoodsReceiptNote> | GoodsReceiptNote[]>('/goods-receipt-notes', {
    params: {
      status: input.status && input.status !== 'ALL' ? input.status : undefined,
      purchaseOrderId: input.purchaseOrderId?.trim() || undefined,
      page: input.page,
      limit: input.limit,
    },
  });

  const unwrapped = unwrapData<ApiListResponse<GoodsReceiptNote> | GoodsReceiptNote[]>(response.data);
  let result: GoodsReceiptNote[] = [];
  if (Array.isArray(unwrapped)) {
    result = unwrapped;
  } else if (unwrapped && Array.isArray((unwrapped as ApiListResponse<GoodsReceiptNote>).data)) {
    result = (unwrapped as ApiListResponse<GoodsReceiptNote>).data;
  }

  grnCache = { data: result, timestamp: Date.now(), key: cacheKey };
  return result;
}

export async function getGoodsReceiptNote(id: string): Promise<GoodsReceiptNote> {
  const response = await apiClient.get<GoodsReceiptNote>(`/goods-receipt-notes/${encodeURIComponent(id)}`);
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function createGoodsReceiptNote(
  input: CreateGoodsReceiptNoteInput,
): Promise<GoodsReceiptNote> {
  if (!input.images || input.images.length === 0) {
    throw new Error('Bắt buộc chụp hoặc chọn ít nhất 1 ảnh minh chứng khi tạo phiếu nhập kho');
  }

  // BE dùng ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  // CHỈ gửi các field hợp lệ DTO chấp nhận: itemId, actualQty, lotNumber, manufacturedDate, expiryDate, note.
  const cleanItems = (input.items || []).map((item) => {
    const itemObj: any = {
      itemId: String(item.itemId),
      actualQty: Number(item.actualQty),
    };
    if (item.manufacturedDate && String(item.manufacturedDate).trim()) {
      itemObj.manufacturedDate = String(item.manufacturedDate).trim();
    }
    if (item.lotNumber && String(item.lotNumber).trim()) {
      itemObj.lotNumber = String(item.lotNumber).trim();
    }
    if (item.expiryDate && String(item.expiryDate).trim()) {
      itemObj.expiryDate = String(item.expiryDate).trim();
    }
    if (item.note && String(item.note).trim()) {
      itemObj.note = String(item.note).trim();
    }
    return itemObj;
  });

  const formData = new FormData();
  formData.append('purchaseOrderId', String(input.purchaseOrderId));
  formData.append('items', JSON.stringify(cleanItems));

  for (const uri of input.images) {
    appendFileToFormData(formData, uri, 'images');
  }

  const response = await apiClient.post<GoodsReceiptNote>('/goods-receipt-notes', formData);
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function updateGoodsReceiptNoteItems(
  goodsReceiptNoteId: string,
  items: CreateGoodsReceiptNoteItemInput[],
): Promise<GoodsReceiptNote> {
  const cleanItems = items.map((item) => {
    const itemObj: any = {
      itemId: String(item.itemId),
      actualQty: Number(item.actualQty),
      manufacturedDate: String(item.manufacturedDate),
    };
    if (item.lotNumber && String(item.lotNumber).trim()) {
      itemObj.lotNumber = String(item.lotNumber).trim();
    }
    if (item.expiryDate && String(item.expiryDate).trim()) {
      itemObj.expiryDate = String(item.expiryDate).trim();
    }
    if (item.note && String(item.note).trim()) {
      itemObj.note = String(item.note).trim();
    }
    return itemObj;
  });

  const response = await apiClient.patch<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(goodsReceiptNoteId)}/items`,
    { items: cleanItems },
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function submitGoodsReceiptNote(id: string): Promise<GoodsReceiptNote> {
  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/submit`,
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function approveGoodsReceiptNote(id: string): Promise<GoodsReceiptNote> {
  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/approve`,
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function rejectGoodsReceiptNote(
  id: string,
  reason: string,
): Promise<GoodsReceiptNote> {
  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/reject`,
    { reason },
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function deleteGoodsReceiptNote(id: string): Promise<void> {
  await apiClient.delete(`/goods-receipt-notes/${encodeURIComponent(id)}`);
}

export async function uploadGoodsReceiptNoteImage(
  id: string,
  imageUri: string,
): Promise<GoodsReceiptNote> {
  const formData = new FormData();
  appendFileToFormData(formData, imageUri, 'file');

  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/images`,
    formData,
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export const uploadGrnImage = uploadGoodsReceiptNoteImage;

export async function deleteGoodsReceiptNoteImage(
  id: string,
  index: number,
  imageUrl?: string,
  newImages?: string[],
): Promise<GoodsReceiptNote> {
  const encId = encodeURIComponent(id);
  try {
    const response = await apiClient.delete<GoodsReceiptNote>(`/goods-receipt-notes/${encId}/images/${index}`);
    return unwrapData<GoodsReceiptNote>(response.data);
  } catch {
    try {
      const response = await apiClient.delete<GoodsReceiptNote>(`/goods-receipt-notes/${encId}/images`, {
        data: { index, imageUrl, url: imageUrl, images: newImages },
        params: { index, imageUrl },
      });
      return unwrapData<GoodsReceiptNote>(response.data);
    } catch {
      return { id, images: newImages } as any;
    }
  }
}

export const deleteGrnImage = deleteGoodsReceiptNoteImage;

export async function listPurchaseOrdersForReceiving(): Promise<PurchaseOrderSummary[]> {
  let response;
  try {
    response = await apiClient.get('/purchase-orders/receiving');
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      response = await apiClient.get('/purchase-orders');
    } else {
      throw err;
    }
  }
  const unwrapped = unwrapData<any>(response.data);

  let rawList: any[] = [];
  if (Array.isArray(unwrapped)) {
    rawList = unwrapped;
  } else if (unwrapped && typeof unwrapped === 'object') {
    if (Array.isArray(unwrapped.data)) rawList = unwrapped.data;
    else if (Array.isArray(unwrapped.items)) rawList = unwrapped.items;
    else if (Array.isArray(unwrapped.content)) rawList = unwrapped.content;
    else if (Array.isArray(unwrapped.purchaseOrders)) rawList = unwrapped.purchaseOrders;
    else if (Array.isArray(unwrapped.result)) rawList = unwrapped.result;
  }

  return rawList.map((po: any, index: number) => {
    const rawItems = po.items || po.details || po.orderItems || po.products || [];
    const items: PurchaseOrderItem[] = Array.isArray(rawItems)
      ? rawItems.map((item: any, iIdx: number) => ({
          itemId: String(item.itemId || item.id || item.productId || `item-${iIdx + 1}`),
          sku: String(item.sku || item.productSku || item.code || item.productCode || `SKU-${iIdx + 1}`),
          itemName: item.itemName || item.productName || item.name || item.sku || 'Sản phẩm',
          expectedQty: Number(item.expectedQty || item.quantity || item.qty || item.orderedQty || 1),
          receivedQty: Number(item.receivedQty || 0),
          remainingQty: Number(item.remainingQty ?? (Number(item.expectedQty || item.quantity || 1) - Number(item.receivedQty || 0))),
          unit: item.unit || item.unitName || 'Cái',
          unitPrice: item.unitPrice || item.price || 0,
          isPerishable: Boolean(item.isPerishable),
        }))
      : [];

    return {
      id: String(po.id || po.purchaseOrderId || `po-${index + 1}`),
      poNumber: String(po.poNumber || po.code || po.number || po.purchaseOrderNumber || `PO-${index + 1}`),
      supplierName: po.supplierName || po.supplier?.name || po.supplier || 'Nhà cung cấp',
      supplierCode: po.supplierCode || po.supplier?.code || '',
      status: po.status || 'CONFIRMED',
      orderDate: po.orderDate || po.createdAt || po.date || '',
      expectedDate: po.expectedDate || po.deliveryDate || '',
      items,
    };
  });
}
