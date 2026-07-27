import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Printer } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';
import { listPrintJobs, type PrintJob, type PrintJobStatus } from '../api/printing-api';

const statusMap: Record<PrintJobStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  PENDING: { label: 'Xếp hàng', variant: 'neutral' },
  IN_PROGRESS: { label: 'Đang in', variant: 'warning' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'neutral' },
};

export function PrintingScreen() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listPrintJobs();
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <Screen withTabBar>
      <AppHeader
        title="Đơn in ly"
        subtitle={loading ? 'Đang tải dữ liệu...' : `${jobs.length} lệnh in`}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchJobs(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Đang tải danh sách lệnh in...</Text>
          </View>
        ) : jobs.length ? (
          <Surface>
            {jobs.map((item) => {
              const statusCfg = statusMap[item.status] || {
                label: item.status,
                variant: 'neutral',
              };
              const progressStr = `${item.completedQuantity || 0}/${item.quantity || 0}`;
              return (
                <ListRow
                  key={item.id}
                  icon={<Printer size={19} color={colors.primary} />}
                  title={item.jobCode || item.jobId || `PJ #${item.id.substring(0, 8)}`}
                  subtitle={item.templateName || 'Mẫu in tiêu chuẩn'}
                  meta={progressStr}
                  badge={<StatusBadge {...statusCfg} />}
                />
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Chưa có lệnh in ly"
            description="Hiện chưa có lệnh in ly nào trong hệ thống."
            actionLabel="Tải lại"
            onAction={() => fetchJobs()}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

