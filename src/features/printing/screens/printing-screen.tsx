import React from 'react';
import { Printer } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { printJobs, type PrintStatus } from '../data/mock-printing';

const statusMap: Record<PrintStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  QUEUED: { label: 'Xếp hàng', variant: 'neutral' },
  PRINTING: { label: 'Đang in', variant: 'warning' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
};

export function PrintingScreen() {
  return (
    <Screen withTabBar>
      <AppHeader title="Đơn in ly" subtitle="Theo dõi tiến độ in" />
      <Surface>
        {printJobs.map((item) => (
          <ListRow
            key={item.id}
            icon={<Printer size={19} color={colors.primary} />}
            title={item.code}
            subtitle={item.product}
            meta={item.progress}
            badge={<StatusBadge {...statusMap[item.status]} />}
          />
        ))}
      </Surface>
    </Screen>
  );
}
