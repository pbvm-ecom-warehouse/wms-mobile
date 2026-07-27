import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowDownLeft, Plus, RefreshCw, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { WmsRole } from '@/shared/types/auth';
import { AppHeader, EmptyState, ListRow, Screen, SearchField, StatusBadge, Surface } from '@/shared/ui';
import { listScrapNotes } from '../api/scrap-api';
import { CreateScrapModal } from '../components/create-scrap-modal';
import { ScrapDetailModal } from '../components/scrap-detail-modal';
import type { ScrapNote, ScrapNoteStatus } from '../types/scrap';

const filterTabs: { key: ScrapNoteStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DRAFT', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

const statusBadgeMap: Record<
  string,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  DRAFT: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt (Trừ tồn)', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
};

export function ScrapScreen() {
  const { user } = useAuth();
  const [scrapList, setScrapList] = useState<ScrapNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<ScrapNoteStatus | 'ALL'>('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ScrapNote | null>(null);

  const userRole = user?.role?.toUpperCase();
  const canCreate =
    userRole === WmsRole.COUNTER ||
    userRole === WmsRole.RECEIVER ||
    userRole === WmsRole.ADMIN;

  const fetchScraps = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      try {
        const data = await listScrapNotes({ status: activeStatus });
        setScrapList(data);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách phiếu hủy hàng';
        setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeStatus],
  );

  useEffect(() => {
    fetchScraps();
  }, [fetchScraps]);

  const query = search.trim().toLowerCase();
  const filteredList = scrapList.filter((item) => {
    if (!query) return true;
    const matchId = item.id.toLowerCase().includes(query);
    const matchUser = item.createdBy?.toLowerCase().includes(query);
    const matchItem = item.items?.some(
      (it) =>
        it.sku?.toLowerCase().includes(query) ||
        it.itemName?.toLowerCase().includes(query) ||
        it.reason?.toLowerCase().includes(query),
    );
    return Boolean(matchId || matchUser || matchItem);
  });

  const handleCreated = (created: ScrapNote) => {
    setScrapList((prev) => [created, ...prev]);
  };

  const handleUpdated = (updated: ScrapNote) => {
    setScrapList((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setSelectedNote(updated);
  };

  return (
    <Screen withTabBar>
      <AppHeader
        title="Phiếu Hủy Hàng"
        subtitle={loading ? 'Đang kết nối API...' : `${scrapList.length} phiếu đền bù / hủy`}
        trailing={
          canCreate ? (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center gap-1.5 bg-[#0878f9] px-3.5 py-2.5 rounded-2xl active:opacity-90 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel="Tạo phiếu hủy"
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
        placeholder="Tìm theo ID, người tạo, SKU hoặc lý do..."
      />

      {errorMsg ? (
        <View className="bg-[#ffebeb] p-3 mt-3 rounded-xl border border-[#c83a3a]/20 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-[#c83a3a] flex-1 mr-2">{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchScraps()} className="p-1">
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
            onRefresh={() => fetchScraps(true)}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs text-[#6c7078] mt-3">Tải danh sách phiếu hủy hàng...</Text>
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
                  onPress={() => setSelectedNote(item)}
                  activeOpacity={0.7}
                >
                  <ListRow
                    icon={<Trash2 size={19} color="#dc2626" />}
                    title={`Phiếu Hủy #${item.id.substring(0, 8).toUpperCase()}`}
                    subtitle={`Bởi: ${item.createdBy || 'N/A'} · ${itemCount} sản phẩm`}
                    meta={createdStr}
                    badge={<StatusBadge {...statusCfg} />}
                  />
                </TouchableOpacity>
              );
            })}
          </Surface>
        ) : (
          <EmptyState
            title="Không tìm thấy phiếu hủy hàng"
            description={
              search
                ? 'Không có phiếu hủy nào khớp với từ khóa tìm kiếm.'
                : 'Hiện chưa có phiếu hủy hàng nào trong hệ thống.'
            }
            actionLabel={search ? 'Xóa từ khóa' : 'Tải lại'}
            onAction={search ? () => setSearch('') : () => fetchScraps()}
          />
        )}
      </ScrollView>

      {/* Create Modal */}
      <CreateScrapModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreated}
      />

      {/* Detail Modal */}
      <ScrapDetailModal
        visible={Boolean(selectedNote)}
        scrapNote={selectedNote}
        onClose={() => setSelectedNote(null)}
        onUpdate={handleUpdated}
      />
    </Screen>
  );
}
