import React from 'react';
import { Truck } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { deliveries, type ShippingStatus } from '../data/mock-shipping';

const statusMap: Record<ShippingStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  READY: { label: 'Sẵn sàng', variant: 'neutral' },
  IN_TRANSIT: { label: 'Đang giao', variant: 'warning' },
  DELIVERED: { label: 'Đã giao', variant: 'success' },
};

export function ShippingScreen() {
  return (
    <Screen withTabBar>
      <AppHeader title="Giao hàng" subtitle="Vận đơn được phân công" />
      <Surface>
        {deliveries.map((item) => (
          <ListRow
            key={item.id}
            icon={<Truck size={19} color={colors.primary} />}
            title={item.code}
            subtitle={`${item.recipient} · ${item.address}`}
            badge={<StatusBadge {...statusMap[item.status]} />}
          />
        ))}
      </Surface>
    </Screen>
  );
}
