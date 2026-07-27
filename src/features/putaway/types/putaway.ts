export type PutawayTaskStatus = 'PENDING' | 'COMPLETED';

export interface PutawayTaskItem {
  itemId: string;
  sku: string;
  itemName?: string;
  quantity: number;
  remainingQty?: number;
  unit?: string;
  lotId?: string | null;
  lotNumber?: string | null;
  shelfCode?: string | null;
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

export interface QueryPutawayTasksInput {
  status?: PutawayTaskStatus | 'ALL';
  page?: number;
  limit?: number;
  grnId?: string;
}

export interface ConfirmPutawayLineInput {
  itemBarcode: string;
  shelfCode: string;
  quantity: number;
  lotId?: string;
}

export interface PutawaySuggestionInput {
  sku: string;
  quantity: number;
}

export interface PutawayShelfSuggestion {
  shelfCode: string;
  capacity: number;
}

export interface PutawaySuggestionResponse {
  suggestions?: PutawayShelfSuggestion[];
  warning?: 'ITEM_NO_DIMENSIONS' | 'NO_SHELF_FITS' | 'INSUFFICIENT_CAPACITY' | null;
}
