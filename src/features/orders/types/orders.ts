export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'SENT',
  'PARTIALLY_RECEIVED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  itemName?: string;
  expectedQty: number;
  receivedQty?: number;
  remainingQty?: number;
  unit: string;
  unitPrice: number;
  itemDepth?: number;
  itemWidth?: number;
  itemHeight?: number;
}

export interface PurchaseOrderSupplierSummary {
  id?: string;
  code?: string;
  name?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  supplier?: PurchaseOrderSupplierSummary | null;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  totalAmount?: number;
  note?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderItemInput {
  itemId: string;
  expectedQty: number;
  unit: string;
  unitPrice?: number;
  // Local display only (not sent to BE due to BE whitelist validation)
  sku?: string;
  itemName?: string;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDate?: string;
  note?: string;
  items: CreatePurchaseOrderItemInput[];

  // Local metadata for fallback store display
  supplierName?: string;
  supplierCode?: string;
}

export interface QueryPurchaseOrdersInput {
  status?: PurchaseOrderStatus | 'ALL';
  supplierId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
