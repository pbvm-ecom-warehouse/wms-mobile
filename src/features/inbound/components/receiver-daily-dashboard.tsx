import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  ArrowDownLeft,
  Box,
  CheckCircle2,
  Clock,
  Layers,
  Menu as MenuIcon,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { listGoodsReceiptNotes } from '@/features/inbound/api/grn-api';
import type { GoodsReceiptNote } from '@/features/inbound/types/grn';
import { listPutawayTasks } from '@/features/putaway/api/putaway-api';
import type { PutawayTask } from '@/features/putaway/types/putaway';
import { colors } from '@/shared/theme/tokens';
import { QuickMenuModal, StatusBadge, Surface } from '@/shared/ui';
import { CreateGrnModal } from './create-grn-modal';
import { GrnDetailModal } from './grn-detail-modal';

export function ReceiverDailyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [grnList, setGrnList] = useState<GoodsReceiptNote[]>([]);
  const [putawayList, setPutawayList] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showCreateGrn, setShowCreateGrn] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNote | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [grns, putaways] = await Promise.allSettled([
        listGoodsReceiptNotes({ status: 'ALL' }, isRefresh),
        listPutawayTasks({ status: 'ALL' }, isRefresh),
      ]);

      if (grns.status === 'fulfilled') setGrnList(grns.value || []);
      if (putaways.status === 'fulfilled') setPutawayList(putaways.value || []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Receiver Dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Daily Metrics calculation
  const pendingGrns = grnList.filter((g) => g.status === 'DRAFT' || g.status === 'PENDING_APPROVAL');
  const approvedGrns = grnList.filter((g) => g.status === 'APPROVED');
  const rejectedGrns = grnList.filter((g) => g.status === 'REJECTED');

  const pendingPutaways = putawayList.filter((p) => p.status === 'PENDING');
  const completedPutaways = putawayList.filter((p) => p.status === 'COMPLETED');

  const totalTasks = grnList.length + putawayList.length;
  const completedTasks = approvedGrns.length + completedPutaways.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <ScrollView
      className="flex-1 bg-[#ececf1] p-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[colors.primary]} />
      }
    >
      {/* Top App Header with Left Menu ☰ & App Name */}
      <View className="flex-row items-center justify-between mb-4 pt-1">
        <TouchableOpacity
          onPress={() => setShowQuickMenu(true)}
          className="p-2.5 bg-white rounded-2xl border border-[#e4e5e9] shadow-sm flex-row items-center gap-1.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Mở menu 3 gạch"
        >
          <MenuIcon size={20} color="#0878f9" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-[#0878f9]/10">
            <Box size={20} color="#0878f9" strokeWidth={2.3} />
          </View>
          <View className="items-start">
            <Text className="text-base font-extrabold text-[#101114]">Stock Mate</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/profile')}
          className="p-2.5 bg-white rounded-2xl border border-[#e4e5e9] shadow-sm active:opacity-80"
        >
          <UserRound size={19} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Header Banner */}
      <View className="bg-[#0878f9] rounded-3xl p-5 mb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-semibold text-white/80 uppercase">Bảng công việc Receiver</Text>
            <Text className="text-xl font-extrabold text-white mt-0.5">
              Xin chào, {user?.name || 'Receiver'} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchData(true)}
            className="p-2 bg-white/20 rounded-full"
          >
            <RefreshCw size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-white/90 font-medium">{todayStr}</Text>

        {/* Progress Bar */}
        <View className="mt-4 bg-white/20 p-3 rounded-2xl">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs font-bold text-white">Tiến độ công việc hôm nay</Text>
            <Text className="text-xs font-extrabold text-white">{completionRate}%</Text>
          </View>
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <View style={{ width: `${completionRate}%` }} className="h-full bg-white rounded-full" />
          </View>
        </View>
      </View>

      {/* Thông số trong ngày (Key Metrics Grid) */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Thông số trong ngày
      </Text>
      <View className="flex-row gap-2.5 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/inbound')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Phiếu Nhập</Text>
            <ArrowDownLeft size={16} color="#0878f9" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0878f9] my-0.5">{grnList.length}</Text>
          <Text className="text-[11px] font-semibold text-[#15803d]">
            {pendingGrns.length} chờ xử lý · {approvedGrns.length} xong
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/putaway')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Cất Hàng</Text>
            <Layers size={16} color="#d97706" />
          </View>
          <Text className="text-2xl font-extrabold text-[#d97706] my-0.5">{putawayList.length}</Text>
          <Text className="text-[11px] font-semibold text-[#b45309]">
            {pendingPutaways.length} đang cất · {completedPutaways.length} xong
          </Text>
        </TouchableOpacity>
      </View>

      {/* Những việc cần làm trong ngày (Daily To-Do List) */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-xs font-bold text-[#6c7078] uppercase">
          Những việc cần làm trong ngày
        </Text>
        <Text className="text-xs font-bold text-[#0878f9]">
          {pendingGrns.length + pendingPutaways.length} việc tồn
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="py-10 items-center bg-white rounded-2xl border border-[#e4e5e9] mb-4">
          <ActivityIndicator size="small" color="#0878f9" />
          <Text className="text-xs text-[#6c7078] mt-2">Đang tải danh sách công việc Receiver...</Text>
        </View>
      ) : (
        <View className="gap-3 mb-6">
          {/* Pending GRNs */}
          {pendingGrns.map((grn) => (
            <Surface key={grn.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => setSelectedGrn(grn)}>
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center gap-2">
                    <ArrowDownLeft size={18} color="#0878f9" />
                    <Text className="text-sm font-bold text-[#101114]">
                      {grn.grnNumber || `GRN #${grn.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge
                    label={grn.status === 'DRAFT' ? 'Nháp' : 'Chờ duyệt'}
                    variant={grn.status === 'DRAFT' ? 'neutral' : 'warning'}
                  />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1">
                  PO: {grn.purchaseOrderNumber || grn.purchaseOrderId || 'N/A'} · {grn.items?.length || 0} mặt hàng
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-[#0878f9]">Nhà cung cấp: {grn.supplierName || 'N/A'}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedGrn(grn)}
                    className="bg-[#0878f9] px-3.5 py-1.5 rounded-xl"
                  >
                    <Text className="text-xs font-bold text-white">Xử lý ngay</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Pending Putaway Tasks */}
          {pendingPutaways.map((task) => (
            <Surface key={task.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/putaway')}>
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center gap-2">
                    <Layers size={18} color="#d97706" />
                    <Text className="text-sm font-bold text-[#101114]">
                      Cất hàng GRN #{task.grnNumber || task.grnId.substring(0, 6)}
                    </Text>
                  </View>
                  <StatusBadge label="Đang cất" variant="warning" />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1">
                  Cần xếp {task.items?.length || 0} sản phẩm vào kệ chứa
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-[#d97706]">Trạng thái: Chưa xếp xong</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/putaway')}
                    className="bg-[#d97706] px-3.5 py-1.5 rounded-xl"
                  >
                    <Text className="text-xs font-bold text-white">Mở bản đồ cất</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Rejected GRNs */}
          {rejectedGrns.map((grn) => (
            <Surface key={grn.id} className="p-4 bg-[#fff5f5] border border-[#fecaca] rounded-2xl">
              <TouchableOpacity onPress={() => setSelectedGrn(grn)}>
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={18} color="#dc2626" />
                    <Text className="text-sm font-bold text-[#991b1b]">
                      Phiếu từ chối: {grn.grnNumber || grn.id}
                    </Text>
                  </View>
                  <StatusBadge label="Từ chối" variant="danger" />
                </View>
                <Text className="text-xs text-[#b91c1c] mt-1">
                  Kiểm tra lại lý do từ chối và sửa lại thông tin
                </Text>
              </TouchableOpacity>
            </Surface>
          ))}

          {pendingGrns.length === 0 && pendingPutaways.length === 0 && rejectedGrns.length === 0 && (
            <View className="bg-white p-6 rounded-2xl border border-[#e4e5e9] items-center">
              <CheckCircle2 size={36} color="#16a34a" />
              <Text className="text-sm font-extrabold text-[#101114] mt-2">Đã hoàn thành mọi việc!</Text>
              <Text className="text-xs text-[#6c7078] text-center mt-1">
                Không có phiếu nhập kho hay tác vụ cất hàng nào đang tồn đọng.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Create GRN Modal */}
      <CreateGrnModal
        visible={showCreateGrn}
        onClose={() => setShowCreateGrn(false)}
        onSuccess={() => fetchData(true)}
      />

      {/* Detail GRN Modal */}
      <GrnDetailModal
        visible={Boolean(selectedGrn)}
        grn={selectedGrn}
        onClose={() => setSelectedGrn(null)}
        onUpdate={() => fetchData(true)}
        onDelete={() => fetchData(true)}
      />

      {/* Quick All-in-One Menu Modal ☰ */}
      <QuickMenuModal
        visible={showQuickMenu}
        onClose={() => setShowQuickMenu(false)}
      />
    </ScrollView>
  );
}
