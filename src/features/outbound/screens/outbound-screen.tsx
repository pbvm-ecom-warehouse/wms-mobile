import React from 'react';
import { ArrowUpRight } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { outboundOrders, type OutboundStatus } from '../data/mock-outbound';

const statusMap: Record<OutboundStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  PENDING: { label: 'Đang chờ', variant: 'neutral' },
  PICKING: { label: 'Đang soạn', variant: 'warning' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
};

export function OutboundScreen() {
  return (
    <Screen withTabBar>
      <AppHeader title="Xuất kho" subtitle={`${outboundOrders.length} phiếu gần nhất`} />
      <Surface>
        {outboundOrders.map((item) => {
          const status = statusMap[item.status];
          return (
            <ListRow
              key={item.id}
              icon={<ArrowUpRight size={19} color={colors.primary} />}
              title={item.code}
              subtitle={`${item.customer} · ${item.itemCount} sản phẩm · Ưu tiên ${item.priority}`}
              badge={<StatusBadge {...status} />}
            />
          );
        })}
      </Surface>
    </Screen>
  );
}
