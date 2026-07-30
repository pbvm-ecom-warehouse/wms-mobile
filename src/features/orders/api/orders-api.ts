import { apiClient, unwrapData } from '@/shared/lib/api-client';
import type {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderStatus,
  QueryPurchaseOrdersInput,
} from '../types/orders';

function cleanDateOnly(rawDate?: string): string {
  if (!rawDate) return '';
  return String(rawDate).split('T')[0].split(' ')[0];
}

export async function listPurchaseOrders(
  input: QueryPurchaseOrdersInput = {},
): Promise<PurchaseOrder[]> {
  let response;
  try {
    response = await apiClient.get<any>('/purchase-orders', {
      params: {
        limit: input.limit || 50,
        page: input.page || 1,
        status: input.status && input.status !== 'ALL' ? input.status : undefined,
        supplierId: input.supplierId ? input.supplierId : undefined,
      },
    });
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      response = await apiClient.get('/purchase-orders/receiving');
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

  const apiList: PurchaseOrder[] = rawList.map((po: any, index: number) => {
    const rawItems = po.items || po.details || po.orderItems || po.products || [];
    const items = Array.isArray(rawItems)
      ? rawItems.map((item: any, iIdx: number) => ({
          itemId: String(item.itemId || item.id || `item-${iIdx + 1}`),
          sku: String(item.sku || item.productSku || `SKU-${iIdx + 1}`),
          itemName: item.itemName || item.productName || item.name || 'Sản phẩm',
          expectedQty: Number(item.expectedQty || item.quantity || 1),
          receivedQty: Number(item.receivedQty || 0),
          remainingQty: Number(item.remainingQty ?? (Number(item.expectedQty || item.quantity || 1) - Number(item.receivedQty || 0))),
          unit: item.unit || 'Thùng',
          unitPrice: Number(item.unitPrice || item.price || 0),
          itemDepth: item.itemDepth,
          itemWidth: item.itemWidth,
          itemHeight: item.itemHeight,
        }))
      : [];

    const supplierObj = po.supplier;
    const suppName = po.supplierName || (typeof supplierObj === 'string' ? supplierObj : supplierObj?.name) || 'Nhà cung cấp';
    const suppCode = po.supplierCode || supplierObj?.code || '';

    return {
      id: String(po.id || po.purchaseOrderId || `po-${index + 1}`),
      poNumber: String(po.poNumber || po.code || po.number || po.purchaseOrderNumber || `PO-${index + 1}`),
      supplierId: String(po.supplierId || supplierObj?.id || ''),
      supplierName: suppName,
      supplierCode: suppCode,
      supplier: supplierObj || null,
      status: (po.status || 'CONFIRMED') as PurchaseOrderStatus,
      orderDate: cleanDateOnly(po.orderDate || po.createdAt),
      expectedDate: cleanDateOnly(po.expectedDate || po.deliveryDate),
      totalAmount: po.totalAmount || items.reduce((acc, it) => acc + it.expectedQty * (it.unitPrice || 0), 0),
      note: po.note || po.description || '',
      items,
      createdAt: po.createdAt || new Date().toISOString(),
      updatedAt: po.updatedAt || new Date().toISOString(),
    };
  });

  let filtered = apiList;
  if (input.search?.trim()) {
    const q = input.search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.poNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.items.some((it) => it.sku.toLowerCase().includes(q) || (it.itemName && it.itemName.toLowerCase().includes(q))),
    );
  }

  return filtered;
}

export async function getPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder> {
  const response = await apiClient.get<any>(`/purchase-orders/${encodeURIComponent(purchaseOrderId)}`);
  const po = unwrapData<any>(response.data);

  const rawItems = po.items || po.details || po.orderItems || po.products || [];
  const items = Array.isArray(rawItems)
    ? rawItems.map((item: any, iIdx: number) => ({
        itemId: String(item.itemId || item.id || `item-${iIdx + 1}`),
        sku: String(item.sku || item.productSku || `SKU-${iIdx + 1}`),
        itemName: item.itemName || item.productName || item.name || 'Sản phẩm',
        expectedQty: Number(item.expectedQty || item.quantity || 1),
        receivedQty: Number(item.receivedQty || 0),
        remainingQty: Number(item.remainingQty ?? (Number(item.expectedQty || item.quantity || 1) - Number(item.receivedQty || 0))),
        unit: item.unit || 'Thùng',
        unitPrice: Number(item.unitPrice || item.price || 0),
      }))
    : [];

  const supplierObj = po.supplier;
  const suppName = po.supplierName || (typeof supplierObj === 'string' ? supplierObj : supplierObj?.name) || 'Nhà cung cấp';
  const suppCode = po.supplierCode || supplierObj?.code || '';

  return {
    id: String(po.id || po.purchaseOrderId),
    poNumber: String(po.poNumber || po.code || po.number || po.purchaseOrderNumber),
    supplierId: String(po.supplierId || supplierObj?.id || ''),
    supplierName: suppName,
    supplierCode: suppCode,
    supplier: supplierObj || null,
    status: (po.status || 'CONFIRMED') as PurchaseOrderStatus,
    orderDate: cleanDateOnly(po.orderDate || po.createdAt),
    expectedDate: cleanDateOnly(po.expectedDate || po.deliveryDate),
    totalAmount: po.totalAmount || items.reduce((acc, it) => acc + it.expectedQty * (it.unitPrice || 0), 0),
    note: po.note || po.description || '',
    items,
    createdAt: po.createdAt || new Date().toISOString(),
    updatedAt: po.updatedAt || new Date().toISOString(),
  };
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<PurchaseOrder> {
  const cleanExpDate = cleanDateOnly(input.expectedDate);
  const payload: any = {
    supplierId: input.supplierId,
    items: input.items.map((it) => ({
      itemId: it.itemId,
      expectedQty: Number(it.expectedQty),
      unit: it.unit ? it.unit.trim().toLowerCase() : 'thùng',
      unitPrice: Number(it.unitPrice || 0),
    })),
  };

  if (cleanExpDate) {
    payload.expectedDate = `${cleanExpDate}T00:00:00.000Z`;
  }
  if (input.note?.trim()) {
    payload.note = input.note.trim();
  }

  const response = await apiClient.post<any>('/purchase-orders', payload);
  const created = unwrapData<any>(response.data);

  return {
    id: String(created.id || created.purchaseOrderId || ''),
    poNumber: String(created.poNumber || created.code || created.number || ''),
    supplierId: String(created.supplierId || input.supplierId),
    supplierName: created.supplierName || input.supplierName || 'Nhà cung cấp',
    supplierCode: created.supplierCode || input.supplierCode || '',
    status: (created.status || 'CONFIRMED') as PurchaseOrderStatus,
    orderDate: cleanDateOnly(created.orderDate || created.createdAt || new Date().toISOString()),
    expectedDate: cleanDateOnly(created.expectedDate || input.expectedDate),
    totalAmount: created.totalAmount || input.items.reduce((acc, it) => acc + (it.expectedQty * (it.unitPrice || 0)), 0),
    note: created.note || input.note || '',
    items: Array.isArray(created.items)
      ? created.items.map((it: any) => ({
          itemId: String(it.itemId || it.id),
          sku: String(it.sku || 'SKU'),
          itemName: it.itemName || 'Sản phẩm',
          expectedQty: Number(it.expectedQty || 1),
          receivedQty: Number(it.receivedQty || 0),
          remainingQty: Number(it.remainingQty || it.expectedQty || 1),
          unit: it.unit || 'Thùng',
          unitPrice: Number(it.unitPrice || 0),
        }))
      : input.items.map((it) => ({
          itemId: it.itemId,
          sku: it.sku || 'SKU',
          itemName: it.itemName || 'Sản phẩm',
          expectedQty: it.expectedQty,
          receivedQty: 0,
          remainingQty: it.expectedQty,
          unit: it.unit || 'Thùng',
          unitPrice: it.unitPrice || 0,
        })),
    createdAt: created.createdAt || new Date().toISOString(),
    updatedAt: created.updatedAt || new Date().toISOString(),
  };
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
): Promise<void> {
  await apiClient.patch(`/purchase-orders/${encodeURIComponent(id)}/status`, { status });
}
