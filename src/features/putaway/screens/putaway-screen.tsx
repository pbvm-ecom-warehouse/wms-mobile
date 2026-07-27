import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Layers, RefreshCw } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppHeader, EmptyState, ListRow, Screen, SearchField, StatusBadge, Surface } from '@/shared/ui';
import { listPutawayTasks } from '../api/putaway-api';
import { PutawayDetailModal } from '../components/putaway-detail-modal';
import type { PutawayTask, PutawayTaskStatus } from '../types/putaway';

const filterTabs: { key: PutawayTaskStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ cất hàng' },
  { key: 'COMPLETED', label: 'Đã cất hàng' },
];

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' }
> = {
  PENDING: { label: 'Chờ cất hàng', variant: 'warning' },
  COMPLETED: { label: 'Đã cất hàng', variant: 'success' },
};

export function PutawayScreen() {
  const [taskList, setTaskList] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<PutawayTaskStatus | 'ALL'>('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<PutawayTask | null>(null);

  const fetchTasks = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      try {
        const data = await listPutawayTasks({ status: activeStatus });
        setTaskList(data);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách lệnh cất hàng';
        setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeStatus],
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const query = search.trim().toLowerCase();
  const filteredList = taskList.filter((item) => {
    if (!query) return true;
    const matchId = item.id.toLowerCase().includes(query);
    const matchGrn = item.grnNumber?.toLowerCase().includes(query) || item.grnId?.toLowerCase().includes(query);
    const matchItem = item.items?.some(
      (it) => it.sku?.toLowerCase().includes(query) || it.itemName?.toLowerCase().includes(query),
    );
    return Boolean(matchId || matchGrn || matchItem);
  });

  const handleTaskUpdated = (updated: PutawayTask) => {
    setTaskList((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setSelectedTask(updated);
  };

  return (
    <Screen withTabBar>
      <AppHeader
        title="Lệnh Cất Hàng (Put-away)"
        subtitle={loading ? 'Đang kết nối API...' : `${taskList.length} lệnh cất hàng`}
      />

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-3">
        {filterTabs.map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveStatus(tab.key)}
              className={`px-3 py-1.5 rounded-full border ${
                isActive ? 'bg-[#0878f9] border-[#0878f9]' : 'bg-white border-[#e4e5e9]'
              }`}
            >
              <Text className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-[#6c7078]'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Field */}
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo Task ID, GRN ID hoặc SKU..."
      />

      {errorMsg ? (
        <View className="bg-[#ffebeb] p-3 mt-3 rounded-xl border border-[#c83a3a]/20 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-[#c83a3a] flex-1 mr-2">{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchTasks()} className="p-1">
            <RefreshCw size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Content List */}
      <ScrollView
        className="flex-1 mt-3"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTasks(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Tải danh sách lệnh cất hàng...</Text>
          </View>
        ) : filteredList.length > 0 ? (
          <Surface>
            {filteredList.map((item) => {
              const statusCfg = statusBadgeMap[item.status] || {
                label: item.status,
                variant: 'neutral',
              };
              const createdStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                : '';
              const itemCount = item.items?.length || 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedTask(item)}
                  activeOpacity={0.7}
                >
                  <ListRow
                    icon={<Layers size={19} color="#0878f9" />}
                    title={`Lệnh cất #${item.id.substring(0, 8).toUpperCase()}`}
                    subtitle={`GRN: ${item.grnNumber || item.grnId || 'N/A'} · ${itemCount} dòng hàng`}
                    meta={createdStr}
                    badge={<StatusBadge {...statusCfg} />}
                  />
                </TouchableOpacity>
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Không tìm thấy lệnh cất hàng"
            description={
              search
                ? 'Không có lệnh cất hàng nào khớp với từ khóa.'
                : 'Hiện chưa có lệnh cất hàng (Put-away) nào trong hệ thống.'
            }
            actionLabel={search ? 'Xóa từ khóa' : 'Tải lại'}
            onAction={search ? () => setSearch('') : () => fetchTasks()}
          />
        )}
      </ScrollView>

      {/* Detail Modal */}
      <PutawayDetailModal
        visible={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdated}
      />
    </Screen>
  );
}
