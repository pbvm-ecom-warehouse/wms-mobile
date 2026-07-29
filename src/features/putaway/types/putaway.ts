export type PutawayTaskStatus = 'PENDING' | 'COMPLETED';

export interface NavigationPoint {
  xM: number;
  yM: number;
}

export interface NavigationPath {
  startGateCode: string;
  targetRackId: string;
  points: NavigationPoint[];
  distanceM: number;
}

export interface PutawayPackageSpec {
  depthCm: number;
  widthCm: number;
  heightCm: number;
  volumeCm3: number;
}

export interface PutawayTaskItem {
  itemId: string;
  sku: string;
  itemName?: string;
  quantity: number;
  remainingQty?: number;
  unit?: string;
  lotId?: string | null;
  lotNumber?: string | null;
  manufacturedDate?: string | null;
  expiryDate?: string | null;
  shelfCode?: string | null;
  packageSpec?: PutawayPackageSpec;
}

export interface PutawayTask {
  id: string;
  grnId: string;
  grnNumber?: string;
  status: PutawayTaskStatus;
  items: PutawayTaskItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PutawayWorkItem {
  key: string;
  taskId: string;
  grnId: string;
  grnNumber: string;
  itemId: string;
  sku: string;
  itemName: string;
  barcode?: string;
  itemType?: string;
  lotId?: string;
  lotNumber?: string;
  manufacturedDate?: string;
  expiryDate?: string;
  quantity: number;
  remainingQty: number;
  packageSpec?: PutawayPackageSpec;
}

export interface QueryPutawayTasksInput {
  status?: PutawayTaskStatus | 'ALL';
  page?: number;
  limit?: number;
  grnId?: string;
}

export interface ConfirmPutawayLineInput {
  itemBarcode: string;
  cellBarcode?: string;
  shelfCode?: string;
  quantity?: number;
  suggestedCellId?: string;
  lotId?: string;
}

export interface PutawaySuggestionInput {
  sku: string;
  packageCount: number;
  lotId?: string;
  packageSpec?: PutawayPackageSpec;
}

export type PutawaySuggestionReason =
  | 'SAME_SKU_LOT_CELL'
  | 'SAME_SKU_CELL'
  | 'BEST_FIT_VOLUME';

export interface PutawayShelfSuggestion {
  shelfCode: string;
  capacity: number;
  cellId?: string;
  cellCode?: string;
  rackId?: string;
  level?: number;
  bay?: number;
  fillPercent?: number;
  reason?: PutawaySuggestionReason;
  path?: NavigationPath;
}

export type PutawaySuggestionWarning =
  | 'ITEM_NO_DIMENSIONS'
  | 'NO_SHELF_FITS'
  | 'INSUFFICIENT_CAPACITY'
  | 'NO_NAVIGATION_PATH';

export interface PutawaySuggestionResponse {
  suggestions?: PutawayShelfSuggestion[];
  warning?: PutawaySuggestionWarning | null;
}
