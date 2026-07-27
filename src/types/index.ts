export enum WmsRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEIVER = 'RECEIVER',
  PICKER = 'PICKER',
  PRINTER = 'PRINTER',
  COUNTER = 'COUNTER',
  SHIPPER = 'SHIPPER',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: WmsRole | string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  status?: 'ACTIVE' | 'LOCKED' | string;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  totalQuantity: number;
  availableQuantity: number;
  barcode: string;
  location: string;
  image?: string;
}

export interface GRNItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  unit: string;
}

export interface GRN {
  id: string;
  code: string;
  poNumber: string;
  supplierName: string;
  totalItems: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  items: GRNItem[];
}

export interface PickItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  location: string;
  quantityToPick: number;
  pickedQuantity: number;
  isPicked: boolean;
}

export interface GoodsIssue {
  id: string;
  code: string;
  customerName: string;
  totalItems: number;
  status: 'PENDING' | 'PICKING' | 'COMPLETED';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  createdAt: string;
  items: PickItem[];
}

export interface PrintJob {
  id: string;
  jobCode: string;
  productName: string;
  cupSize: string;
  quantity: number;
  printedQuantity: number;
  status: 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  designUrl?: string;
}

export interface StockCount {
  id: string;
  code: string;
  warehouseZone: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  totalSKUs: number;
  discrepanciesCount: number;
  createdAt: string;
}

export interface Adjustment {
  id: string;
  code: string;
  productSku: string;
  productName: string;
  quantityChange: number;
  reason: string;
  status: 'APPROVED' | 'PENDING';
  createdAt: string;
}

export interface ShippingDelivery {
  id: string;
  trackingCode: string;
  recipientName: string;
  phone: string;
  address: string;
  codAmount: number;
  status: 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  deliveryNote?: string;
  createdAt: string;
}
