export type OutboundStatus = 'PENDING' | 'PICKING' | 'COMPLETED';

export interface OutboundOrder {
  id: string;
  code: string;
  customer: string;
  itemCount: number;
  priority: 'Cao' | 'Thường' | 'Thấp';
  status: OutboundStatus;
}

export const outboundOrders: OutboundOrder[] = [
  { id: 'out-1', code: 'PXK-20260727-88', customer: 'Mixue Tân Phú', itemCount: 4, priority: 'Cao', status: 'PICKING' },
  { id: 'out-2', code: 'PXK-20260727-89', customer: 'Highlands Coffee Q1', itemCount: 2, priority: 'Thường', status: 'PENDING' },
  { id: 'out-3', code: 'PXK-20260726-70', customer: 'Phúc Long Coffee & Tea', itemCount: 6, priority: 'Thấp', status: 'COMPLETED' },
];
