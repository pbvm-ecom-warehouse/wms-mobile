export type InboundStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface InboundReceipt {
  id: string;
  code: string;
  supplier: string;
  itemCount: number;
  createdAt: string;
  status: InboundStatus;
}

export const inboundReceipts: InboundReceipt[] = [
  { id: 'in-1', code: 'PNK-20260727-01', supplier: 'Bao Bì Xanh Việt Nam', itemCount: 3, createdAt: '09:30', status: 'IN_PROGRESS' },
  { id: 'in-2', code: 'PNK-20260726-04', supplier: 'Nhựa Đông Á', itemCount: 5, createdAt: 'Hôm qua', status: 'PENDING' },
  { id: 'in-3', code: 'PNK-20260725-02', supplier: 'Đóng Gói Tân Bình', itemCount: 2, createdAt: '25/07', status: 'COMPLETED' },
];
