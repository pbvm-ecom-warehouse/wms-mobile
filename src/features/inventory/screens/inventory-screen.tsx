import React from 'react';
import { ClipboardCheck } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { stockCounts, type InventoryStatus } from '../data/mock-inventory';

const statusMap: Record<InventoryStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  PLANNED: { label: 'Đã lên lịch', variant: 'neutral' },
  IN_PROGRESS: { label: 'Đang kiểm', variant: 'warning' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
};

export function InventoryScreen() {
  return (
    <Screen withTabBar>
      <AppHeader title="Kiểm kê" subtitle="Kế hoạch và chênh lệch tồn kho" />
      <Surface>
        {stockCounts.map((item) => (
          <ListRow
            key={item.id}
            icon={<ClipboardCheck size={19} color={colors.primary} />}
            title={item.code}
            subtitle={`${item.zone} · ${item.skuCount} SKU`}
            meta={`${item.differences} lệch`}
            badge={<StatusBadge {...statusMap[item.status]} />}
          />
        ))}
      </Surface>
    </Screen>
  );
}
