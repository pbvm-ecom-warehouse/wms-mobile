export type GoodsReceiptNoteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface GoodsReceiptNoteItem {
  itemId: string;
  sku: string;
  itemName?: string;
  barcode?: string;
  category?: string;
  type?: string;
  images?: string[];
  isPerishable?: boolean;
  expectedQty?: number;
  unitPrice?: number;
  receivedQty?: number;
  remainingQty?: number;
  actualQty: number;
  unit?: string;
  lotNumber?: string | null;
  manufacturedDate?: string | null;
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
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  totalPackageCount?: number;
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
  lotNumber?: string;
  manufacturedDate: string;
  expiryDate?: string;
  note?: string;
}

export interface CreateGoodsReceiptNoteInput {
  purchaseOrderId: string;
  items?: CreateGoodsReceiptNoteItemInput[];
  images?: string[];
}

export interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  itemName?: string;
  expectedQty: number;
  receivedQty?: number;
  remainingQty?: number;
  unit: string;
  unitPrice?: number;
  isPerishable?: boolean;
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
