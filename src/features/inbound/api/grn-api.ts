import { apiClient, unwrapData } from '@/shared/lib/api-client';
import type {
  CreateGoodsReceiptNoteInput,
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

export async function listGoodsReceiptNotes(
  input: QueryGoodsReceiptNotesInput = {},
): Promise<GoodsReceiptNote[]> {
  const response = await apiClient.get<ApiListResponse<GoodsReceiptNote> | GoodsReceiptNote[]>('/goods-receipt-notes', {
    params: {
      status: input.status && input.status !== 'ALL' ? input.status : undefined,
      purchaseOrderId: input.purchaseOrderId?.trim() || undefined,
      page: input.page,
      limit: input.limit,
    },
  });

  const unwrapped = unwrapData<ApiListResponse<GoodsReceiptNote> | GoodsReceiptNote[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListResponse<GoodsReceiptNote>).data)) {
    return (unwrapped as ApiListResponse<GoodsReceiptNote>).data;
  }
  return [];
}

export async function getGoodsReceiptNote(id: string): Promise<GoodsReceiptNote> {
  const response = await apiClient.get<GoodsReceiptNote>(`/goods-receipt-notes/${encodeURIComponent(id)}`);
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function createGoodsReceiptNote(
  input: CreateGoodsReceiptNoteInput,
): Promise<GoodsReceiptNote> {
  const payload = {
    purchaseOrderId: input.purchaseOrderId,
    items: input.items?.map((item) => ({
      itemId: item.itemId,
      actualQty: Number(item.actualQty),
      unit: item.unit,
      lotNumber: item.lotNumber?.trim() || undefined,
      expiryDate: item.expiryDate?.trim() || undefined,
      note: item.note?.trim() || undefined,
    })),
  };

  const response = await apiClient.post<GoodsReceiptNote>('/goods-receipt-notes', payload);
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function confirmGoodsReceiptNote(id: string): Promise<GoodsReceiptNote> {
  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/confirm`,
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export async function approveGoodsReceiptNote(id: string): Promise<GoodsReceiptNote> {
  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/approve`,
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
  const filename = imageUri.split('/').pop() || 'grn_evidence.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // @ts-ignore React Native FormData file payload structure
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  });

  const response = await apiClient.post<GoodsReceiptNote>(
    `/goods-receipt-notes/${encodeURIComponent(id)}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return unwrapData<GoodsReceiptNote>(response.data);
}

export const uploadGrnImage = uploadGoodsReceiptNoteImage;

export async function listPurchaseOrdersForReceiving(): Promise<PurchaseOrderSummary[]> {
  try {
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
            unit: item.unit || item.unitName || 'Cái',
            unitPrice: item.unitPrice || item.price || 0,
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
  } catch (err: any) {
    throw err;
  }
}
