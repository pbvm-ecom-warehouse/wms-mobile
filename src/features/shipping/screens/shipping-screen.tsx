import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Truck } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { listShipments, type Shipment, type ShipmentStatus } from '../api/shipping-api';

const statusMap: Record<ShipmentStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  PENDING: { label: 'Sẵn sàng', variant: 'neutral' },
  ASSIGNED: { label: 'Đã phân công', variant: 'warning' },
  IN_TRANSIT: { label: 'Đang giao', variant: 'warning' },
  DELIVERED: { label: 'Đã giao', variant: 'success' },
  FAILED: { label: 'Thất bại', variant: 'neutral' },
  RETURNED: { label: 'Chuyển hoàn', variant: 'neutral' },
};

export function ShippingScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShipments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listShipments();
      setShipments(data);
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return (
    <Screen withTabBar>
      <AppHeader
        title="Giao hàng"
        subtitle={loading ? 'Đang tải dữ liệu...' : `${shipments.length} vận đơn`}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchShipments(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Đang tải danh sách vận đơn...</Text>
          </View>
        ) : shipments.length ? (
          <Surface>
            {shipments.map((item) => {
              const statusCfg = statusMap[item.status] || {
                label: item.status,
                variant: 'neutral',
              };
              return (
                <ListRow
                  key={item.id}
                  icon={<Truck size={19} color={colors.primary} />}
                  title={item.shipmentNumber || item.trackingNumber || `SP #${item.id.substring(0, 8)}`}
                  subtitle={`${item.recipientName || 'Người nhận'} · ${item.address || 'Địa chỉ kho'}`}
                  badge={<StatusBadge {...statusCfg} />}
                />
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Chưa có vận đơn giao hàng"
            description="Hiện chưa có vận đơn nào được phân công."
            actionLabel="Tải lại"
            onAction={() => fetchShipments()}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

