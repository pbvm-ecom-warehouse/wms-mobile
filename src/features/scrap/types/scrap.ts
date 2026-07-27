export type ScrapNoteStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface ScrapNoteItem {
  itemId: string;
  sku?: string;
  itemName?: string;
  shelfId: string;
  shelfCode?: string;
  lotId?: string | null;
  lotNumber?: string;
  quantity: number;
  reason: string;
  images?: string[];
}

export interface ScrapNote {
  id: string;
  status: ScrapNoteStatus;
  note?: string;
  createdBy: string;
  approvedBy?: string | null;
  rejectReason?: string;
  items: ScrapNoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QueryScrapNotesInput {
  status?: ScrapNoteStatus | 'ALL';
  page?: number;
  limit?: number;
}

export interface CreateScrapNoteItemInput {
  itemId: string;
  lotId?: string;
  shelfId: string;
  quantity: number;
  reason: string;
}

export interface CreateScrapNoteInput {
  note?: string;
  items: CreateScrapNoteItemInput[];
  imageUris?: string[];
}

export interface RejectScrapNoteInput {
  rejectReason: string;
}
