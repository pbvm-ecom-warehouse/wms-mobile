import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ClipboardCheck } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { listStockCounts, type StockCount, type StockCountStatus } from '../api/inventory-api';

const statusMap: Record<StockCountStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  DRAFT: { label: 'Đã lên lịch', variant: 'neutral' },
  COUNTING: { label: 'Đang kiểm', variant: 'warning' },
  WAITING_APPROVAL: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Hoàn tất', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'neutral' },
};

export function InventoryScreen() {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listStockCounts();
      setCounts(data);
    } catch {
      setCounts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <Screen withTabBar>
      <AppHeader
        title="Kiểm kê"
        subtitle={loading ? 'Đang tải dữ liệu...' : `${counts.length} phiếu kiểm kê`}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCounts(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Đang tải danh sách kiểm kê...</Text>
          </View>
        ) : counts.length ? (
          <Surface>
            {counts.map((item) => {
              const statusCfg = statusMap[item.status] || {
                label: item.status,
                variant: 'neutral',
              };
              const skuCount = item.items?.length || 0;
              return (
                <ListRow
                  key={item.id}
                  icon={<ClipboardCheck size={19} color={colors.primary} />}
                  title={item.countNumber || `SC #${item.id.substring(0, 8)}`}
                  subtitle={`${skuCount} mặt hàng đếm`}
                  badge={<StatusBadge {...statusCfg} />}
                />
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Chưa có phiếu kiểm kê"
            description="Hiện chưa có phiếu kiểm kê kho nào."
            actionLabel="Tải lại"
            onAction={() => fetchCounts()}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

