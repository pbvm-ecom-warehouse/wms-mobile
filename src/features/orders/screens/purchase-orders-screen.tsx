import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, RefreshCw, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import {
  AppHeader,
  EmptyState,
  ListRow,
  Screen,
  SearchField,
  StatusBadge,
  Surface,
} from '@/shared/ui';
import { listPurchaseOrders } from '../api/orders-api';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/orders';
import { CreatePurchaseOrderModal } from '../components/create-po-modal';
import { PurchaseOrderDetailModal } from '../components/po-detail-modal';

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'neutral' },
  PARTIALLY_RECEIVED: { label: 'Nhập 1 phần', variant: 'warning' },
  COMPLETED: { label: 'Đã hoàn tất', variant: 'success' },
};

type FilterStatus = 'ALL' | PurchaseOrderStatus;

const filterTabs: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'PARTIALLY_RECEIVED', label: 'Nhập 1 phần' },
  { key: 'COMPLETED', label: 'Đã hoàn tất' },
];

export function PurchaseOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  const userRole = user?.role?.toUpperCase();
  const canCreate = userRole === WmsRole.MANAGER || userRole === WmsRole.ADMIN;

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await listPurchaseOrders({ status: activeStatus });
      setOrders(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ Đơn Đặt Hàng';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

const statusPriority: Record<string, number> = {
  CONFIRMED: 1,
  PARTIALLY_RECEIVED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};

  const query = search.trim().toLowerCase();
  const filteredList = orders
    .filter((item) => {
      if (!query) return true;
      const matchPo = item.poNumber?.toLowerCase().includes(query);
      const matchSupplier = item.supplierName?.toLowerCase().includes(query);
      const matchItem = item.items?.some(
        (it) => it.sku?.toLowerCase().includes(query) || (it.itemName && it.itemName.toLowerCase().includes(query)),
      );
      return Boolean(matchPo || matchSupplier || matchItem);
    })
    .sort((a, b) => {
      const pA = statusPriority[a.status] ?? 99;
      const pB = statusPriority[b.status] ?? 99;
      if (pA !== pB) return pA - pB;
      const dateA = new Date(a.createdAt || a.orderDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.orderDate || 0).getTime();
      return dateB - dateA;
    });

  return (
    <Screen withTabBar>
      {/* Header with Create Button */}
      <AppHeader
        title="Đơn Đặt Hàng"
        subtitle={
          loading
            ? 'Đang kết nối API...'
            : `${orders.length} đơn đặt hàng`
        }
        trailing={
          canCreate ? (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center gap-1.5 bg-[#0878f9] px-3.5 py-2.5 rounded-2xl active:opacity-90 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel="Tạo đơn hàng"
            >
              <Plus size={18} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Tạo đơn</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3 max-h-9">
        {filterTabs.map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveStatus(tab.key)}
              className={`px-3 py-1.5 rounded-full border mr-2 ${
                isActive
                  ? 'bg-[#0878f9] border-[#0878f9]'
                  : 'bg-white border-[#e4e5e9]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-[#6c7078]'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Input */}
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo mã đơn, Nhà cung cấp hoặc SKU"
      />

      {errorMsg ? (
        <View className="bg-[#ffebeb] p-3 mt-3 rounded-xl border border-[#c83a3a]/20 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-[#c83a3a] flex-1 mr-2">{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchOrders()} className="p-1">
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
            onRefresh={() => fetchOrders(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Tải danh sách đơn đặt hàng...</Text>
          </View>
        ) : filteredList.length > 0 ? (
          <Surface>
            {filteredList.map((item) => {
              const statusCfg = statusBadgeMap[item.status] || {
                label: item.status,
                variant: 'neutral',
              };
              const rawDateStr = item.orderDate || item.createdAt || '';
              const createdStr = rawDateStr ? rawDateStr.split('T')[0].split(' ')[0] : '';
              const itemCount = item.items?.length || 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedPo(item)}
                  activeOpacity={0.7}
                >
                  <ListRow
                    icon={<ShoppingCart size={19} color={colors.primary} />}
                    title={item.poNumber || `Đơn #${item.id.substring(0, 8)}`}
                    subtitle={`NCC: ${item.supplierName} · ${itemCount} sản phẩm`}
                    meta={createdStr}
                    badge={<StatusBadge {...statusCfg} />}
                  />
                </TouchableOpacity>
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Không tìm thấy đơn đặt hàng"
            description={
              search
                ? 'Không có đơn đặt hàng nào khớp với từ khóa tìm kiếm.'
                : 'Hiện chưa có đơn đặt hàng nào trong hệ thống.'
            }
            actionLabel={search ? 'Xóa từ khóa' : 'Tải lại'}
            onAction={search ? () => setSearch('') : () => fetchOrders()}
          />
        )}
      </ScrollView>

      {/* Create PO Modal */}
      <CreatePurchaseOrderModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchOrders(true)}
      />

      {/* Detail PO Modal */}
      <PurchaseOrderDetailModal
        visible={Boolean(selectedPo)}
        po={selectedPo}
        onClose={() => setSelectedPo(null)}
        onUpdate={() => fetchOrders(true)}
      />
    </Screen>
  );
}
