import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowDownLeft, Plus, RefreshCw } from 'lucide-react-native';
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
import { listGoodsReceiptNotes } from '../api/grn-api';
import { CreateGrnModal } from '../components/create-grn-modal';
import { GrnDetailModal } from '../components/grn-detail-modal';
import type { GoodsReceiptNote, GoodsReceiptNoteStatus } from '../types/grn';

const statusBadgeMap: Record<
  GoodsReceiptNoteStatus,
  { label: string; variant: 'neutral' | 'warning' | 'success' }
> = {
  DRAFT: { label: 'Nháp', variant: 'neutral' },
  CONFIRMED: { label: 'Xác nhận', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
};

type FilterStatus = 'ALL' | GoodsReceiptNoteStatus;

const filterTabs: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DRAFT', label: 'DRAFT' },
  { key: 'CONFIRMED', label: 'Xác nhận' },
  { key: 'APPROVED', label: 'Đã duyệt' },
];

export function InboundScreen() {
  const { user } = useAuth();
  const [grnList, setGrnList] = useState<GoodsReceiptNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNote | null>(null);

  const userRole = user?.role?.toUpperCase();
  const canCreate =
    userRole === WmsRole.RECEIVER ||
    userRole === WmsRole.ADMIN;

  const fetchGrns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await listGoodsReceiptNotes({
        status: activeStatus,
      });
      setGrnList(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ GRN';
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchGrns();
  }, [fetchGrns]);

  const query = search.trim().toLowerCase();
  const filteredList = grnList.filter((item) => {
    if (!query) return true;
    const matchGrn = item.grnNumber?.toLowerCase().includes(query);
    const matchPo = item.purchaseOrderNumber?.toLowerCase().includes(query) || item.purchaseOrderId?.toLowerCase().includes(query);
    const matchSupplier = item.supplierName?.toLowerCase().includes(query);
    return Boolean(matchGrn || matchPo || matchSupplier);
  });

  const handleGrnUpdated = (updated: GoodsReceiptNote) => {
    setGrnList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedGrn(updated);
  };

  const handleGrnDeleted = (deletedId: string) => {
    setGrnList((prev) => prev.filter((item) => item.id !== deletedId));
    setSelectedGrn(null);
  };

  const handleGrnCreated = (created: GoodsReceiptNote) => {
    setGrnList((prev) => [created, ...prev]);
  };

  return (
    <Screen withTabBar>
      {/* Header with Create Button */}
      <AppHeader
        title="Phiếu Nhập Kho"
        subtitle={
          loading
            ? 'Đang kết nối API...'
            : `${grnList.length} phiếu nhập`
        }
        trailing={
          canCreate ? (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center gap-1.5 bg-[#0878f9] px-3.5 py-2.5 rounded-2xl active:opacity-90 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel="Tạo phiếu nhập"
            >
              <Plus size={18} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Tạo phiếu</Text>
            </TouchableOpacity>
          ) : undefined
        }
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
      </View>

      {/* Search Input */}
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm theo mã GRN, PO hoặc Nhà cung cấp"
      />

      {errorMsg ? (
        <View className="bg-[#ffebeb] p-3 mt-3 rounded-xl border border-[#c83a3a]/20 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-[#c83a3a] flex-1 mr-2">{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchGrns()} className="p-1">
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
            onRefresh={() => fetchGrns(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Tải danh sách phiếu nhập kho...</Text>
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
                  onPress={() => setSelectedGrn(item)}
                  activeOpacity={0.7}
                >
                  <ListRow
                    icon={<ArrowDownLeft size={19} color={colors.primary} />}
                    title={item.grnNumber || `GRN #${item.id.substring(0, 8)}`}
                    subtitle={`PO: ${item.purchaseOrderNumber || item.purchaseOrderId || 'N/A'} · ${itemCount} sản phẩm`}
                    meta={createdStr}
                    badge={<StatusBadge {...statusCfg} />}
                  />
                </TouchableOpacity>
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Không tìm thấy phiếu nhập kho"
            description={
              search
                ? 'Không có phiếu nào khớp với từ khóa tìm kiếm.'
                : 'Hiện chưa có phiếu nhập kho (GRN) nào trong hệ thống.'
            }
            actionLabel={search ? 'Xóa từ khóa' : 'Tải lại'}
            onAction={search ? () => setSearch('') : () => fetchGrns()}
          />
        )}
      </ScrollView>

      {/* Create GRN Modal */}
      <CreateGrnModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGrnCreated}
      />

      {/* Detail GRN Modal */}
      <GrnDetailModal
        visible={Boolean(selectedGrn)}
        grn={selectedGrn}
        onClose={() => setSelectedGrn(null)}
        onUpdate={handleGrnUpdated}
        onDelete={handleGrnDeleted}
      />
    </Screen>
  );
}
