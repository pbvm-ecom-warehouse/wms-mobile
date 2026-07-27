import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { listGoodsIssues, type GoodsIssue, type GoodsIssueStatus } from '../api/outbound-api';

const statusMap: Record<GoodsIssueStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  DRAFT: { label: 'Đang chờ', variant: 'neutral' },
  PICKING: { label: 'Đang soạn', variant: 'warning' },
  PACKING: { label: 'Đóng gói', variant: 'warning' },
  CONFIRMED: { label: 'Xác nhận', variant: 'success' },
  SHIPPED: { label: 'Hoàn tất', variant: 'success' },
};

export function OutboundScreen() {
  const [issues, setIssues] = useState<GoodsIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listGoodsIssues();
      setIssues(data);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return (
    <Screen withTabBar>
      <AppHeader
        title="Xuất kho"
        subtitle={loading ? 'Đang tải dữ liệu...' : `${issues.length} phiếu xuất kho`}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchIssues(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Đang tải danh sách xuất kho...</Text>
          </View>
        ) : issues.length ? (
          <Surface>
            {issues.map((item) => {
              const statusCfg = statusMap[item.status] || {
                label: item.status,
                variant: 'neutral',
              };
              const itemCnt = item.lines?.length || 0;
              return (
                <ListRow
                  key={item.id}
                  icon={<ArrowUpRight size={19} color={colors.primary} />}
                  title={item.issueNumber || `GI #${item.id.substring(0, 8)}`}
                  subtitle={`${item.customerName || item.orderNumber || 'Khách hàng'} · ${itemCnt} sản phẩm`}
                  badge={<StatusBadge {...statusCfg} />}
                />
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Chưa có phiếu xuất kho"
            description="Hiện chưa có phiếu xuất kho nào được tạo."
            actionLabel="Tải lại"
            onAction={() => fetchIssues()}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

