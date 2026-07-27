export type GoodsReceiptNoteStatus = 'DRAFT' | 'CONFIRMED' | 'APPROVED';

export interface GoodsReceiptNoteItem {
  itemId: string;
  sku: string;
  itemName?: string;
  actualQty: number;
  unit: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  note?: string | null;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber?: string;
  supplierName?: string;
  status: GoodsReceiptNoteStatus;
  items: GoodsReceiptNoteItem[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QueryGoodsReceiptNotesInput {
  status?: GoodsReceiptNoteStatus | 'ALL';
  purchaseOrderId?: string;
  page?: number;
  limit?: number;
}

export interface CreateGoodsReceiptNoteItemInput {
  itemId: string;
  actualQty: number;
  unit?: string;
  lotNumber?: string;
  expiryDate?: string;
  note?: string;
}

export interface CreateGoodsReceiptNoteInput {
  purchaseOrderId: string;
  items?: CreateGoodsReceiptNoteItemInput[];
}

export interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  itemName?: string;
  expectedQty: number;
  unit: string;
  unitPrice?: number;
}

export interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  supplierName?: string;
  supplierCode?: string;
  status: string;
  orderDate?: string;
  expectedDate?: string;
  items: PurchaseOrderItem[];
}
