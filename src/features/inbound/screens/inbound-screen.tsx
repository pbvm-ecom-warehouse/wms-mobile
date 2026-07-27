import React from 'react';
import { ArrowDownLeft } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { inboundReceipts, type InboundStatus } from '../data/mock-inbound';

const statusMap: Record<InboundStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  PENDING: { label: 'Đang chờ', variant: 'neutral' },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'warning' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
};

export function InboundScreen() {
  return (
    <Screen withTabBar>
      <AppHeader title="Nhập kho" subtitle={`${inboundReceipts.length} phiếu gần nhất`} />
      <Surface>
        {inboundReceipts.map((item) => {
          const status = statusMap[item.status];
          return (
            <ListRow
              key={item.id}
              icon={<ArrowDownLeft size={19} color={colors.primary} />}
              title={item.code}
              subtitle={`${item.supplier} · ${item.itemCount} sản phẩm`}
              meta={item.createdAt}
              badge={<StatusBadge {...status} />}
            />
          );
        })}
      </Surface>
    </Screen>
  );
}
