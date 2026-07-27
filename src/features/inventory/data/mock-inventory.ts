export type InventoryStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export const stockCounts = [
  { id: 'stock-1', code: 'KK-202607-Q3', zone: 'Khu vực A · Ly và bao bì', skuCount: 45, differences: 2, status: 'IN_PROGRESS' as InventoryStatus },
  { id: 'stock-2', code: 'KK-202607-Q2', zone: 'Khu vực B · Phụ kiện', skuCount: 80, differences: 0, status: 'PLANNED' as InventoryStatus },
];
