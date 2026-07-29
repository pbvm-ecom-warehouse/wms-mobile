import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MapPin, Package, RefreshCw } from 'lucide-react-native';
import { listGoodsReceiptNotes } from '@/features/inbound/api/grn-api';
import type { GoodsReceiptNote } from '@/features/inbound/types/grn';
import { formatApiError } from '@/shared/lib/api-client';
import {
  AppHeader,
  EmptyState,
  Screen,
  SearchField,
  StatusBadge,
  Surface,
} from '@/shared/ui';
import { listPutawayTasks } from '../api/putaway-api';
import type { PutawayTask, PutawayTaskItem, PutawayTaskStatus } from '../types/putaway';
import { PutawayDetailModal } from '../components/putaway-detail-modal';

type FilterStatus = 'ALL' | PutawayTaskStatus;

const filterTabs: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Đang cất' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
];

export function PutawayScreen() {
  const [tasks, setTasks] = useState<PutawayTask[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceiptNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<PutawayTask | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const [tasksRes, receiptsRes] = await Promise.allSettled([
        listPutawayTasks({ status: activeStatus }, isRefresh),
        listGoodsReceiptNotes({}, isRefresh),
      ]);

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value || []);
      } else {
        console.warn('Lỗi tải Putaway Tasks:', tasksRes.reason);
      }

      if (receiptsRes.status === 'fulfilled') {
        setReceipts(receiptsRes.value || []);
      } else {
        console.warn('Lỗi tải GRN receipts:', receiptsRes.reason);
      }
    } catch (err: any) {
      setErrorMsg(formatApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Flatten items list to directly display Product Name, SKU, and Quantity
  const flatProductItems = useMemo(() => {
    const list: Array<{
      task: PutawayTask;
      item: PutawayTaskItem;
      sku: string;
      itemName: string;
      remainingQty: number;
      status: PutawayTaskStatus;
    }> = [];

    tasks.forEach((t) => {
      if (activeStatus !== 'ALL' && t.status !== activeStatus) return;

      const grn = receipts.find((r) => r.id === t.grnId);
      (t.items || []).forEach((item) => {
        const grnItem = grn?.items?.find((i) => i.itemId === item.itemId);
        const resolvedSku =
          item.sku && !item.sku.startsWith('SKU-')
            ? item.sku
            : grnItem?.sku || item.sku || item.itemId;

        const remaining = item.remainingQty ?? item.quantity ?? 10;
        list.push({
          task: t,
          item,
          sku: resolvedSku,
          itemName: item.itemName || grnItem?.itemName || 'Sản phẩm',
          remainingQty: remaining,
          status: t.status,
        });
      });
    });

    // Sort PENDING ('Đang cất') tasks/items to top, COMPLETED ('Hoàn thành') items to bottom
    list.sort((a, b) => {
      const aIsPending = a.status === 'PENDING' && a.remainingQty > 0;
      const bIsPending = b.status === 'PENDING' && b.remainingQty > 0;
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return 0;
    });

    if (!search.trim()) return list;

    const q = search.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.itemName.toLowerCase().includes(q),
    );
  }, [tasks, receipts, activeStatus, search]);

  const handleOpenItemMap = (task: PutawayTask) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  return (
    <Screen withTabBar>
      <AppHeader
        title="Cất Hàng"
        subtitle="Danh sách sản phẩm cần xếp vào khoang kệ kho"
      />

      {/* Search Field */}
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo tên sản phẩm, SKU..."
      />

      {/* Filter Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row my-3"
      >
        {filterTabs.map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveStatus(tab.key)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                isActive
                  ? 'bg-[#0878f9] border-[#0878f9]'
                  : 'bg-white border-[#e4e5e9]'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? 'text-white' : 'text-[#6c7078]'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {errorMsg ? (
        <Surface className="p-3 mb-3 bg-[#ffebeb] border-[#f8c4c4] flex-row justify-between items-center">
          <Text className="text-xs text-[#c83a3a] flex-1 font-semibold mr-2">{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchAllData(true)} className="p-1">
            <RefreshCw size={16} color="#c83a3a" />
          </TouchableOpacity>
        </Surface>
      ) : null}

      {/* Product Items List Card */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAllData(true)} />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="small" color="#0878f9" />
            <Text className="text-xs text-[#6c7078] mt-2 font-medium">
              Đang tải danh sách sản phẩm cất hàng...
            </Text>
          </View>
        ) : flatProductItems.length > 0 ? (
          flatProductItems.map((prod, idx) => {
            const isDone = prod.status === 'COMPLETED' || prod.remainingQty <= 0;
            return (
              <Surface key={idx} className="mb-3 p-4">
                <TouchableOpacity onPress={() => handleOpenItemMap(prod.task)}>
                  {/* Line 1: Product Name & Status */}
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm font-extrabold text-[#101114] flex-1 mr-2" numberOfLines={1}>
                      {prod.itemName}
                    </Text>
                    <StatusBadge
                      label={isDone ? 'Đã hoàn thành' : 'Đang cất'}
                      variant={isDone ? 'success' : 'warning'}
                    />
                  </View>

                  {/* Line 2: SKU */}
                  <Text className="text-xs font-bold text-[#6c7078] mb-2">
                    SKU: <Text className="font-extrabold text-[#0878f9]">{prod.sku}</Text>
                  </Text>

                  {/* Line 3: Quantity & Action Button */}
                  <View className="pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs text-[#6c7078]" numberOfLines={1}>
                        {isDone ? (
                          <>Số lượng: <Text className="text-sm font-extrabold text-[#16a34a]">Đã cất {prod.item.quantity} thùng</Text></>
                        ) : (
                          <>Số lượng: <Text className="text-sm font-extrabold text-[#16a34a]">{prod.remainingQty} thùng</Text></>
                        )}
                      </Text>
                    </View>

                    <View
                      className={`px-3 py-2 rounded-xl shadow-sm items-center justify-center shrink-0 ${
                        isDone ? 'bg-[#16a34a]' : 'bg-[#0878f9]'
                      }`}
                    >
                      <Text className="text-xs font-extrabold text-white text-center" numberOfLines={1}>
                        {isDone ? 'Xem vị trí' : 'Mở bản đồ'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Surface>
            );
          })
        ) : (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Chưa có sản phẩm cất hàng nào phù hợp với bộ lọc tìm kiếm hiện tại."
          />
        )}
      </ScrollView>

      {/* Putaway Execution Detail Modal */}
      <PutawayDetailModal
        visible={modalVisible}
        task={selectedTask}
        receipts={receipts}
        onClose={() => setModalVisible(false)}
        onUpdate={() => fetchAllData(true)}
      />
    </Screen>
  );
}
