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
  Box,
  CheckCircle2,
  ClipboardCheck,
  Menu as MenuIcon,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { listStockCounts } from '@/features/inventory/api/inventory-api';
import type { StockCount } from '@/features/inventory/api/inventory-api';
import { listScrapNotes } from '@/features/scrap/api/scrap-api';
import type { ScrapNote } from '@/features/scrap/types/scrap';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/tokens';
import { QuickMenuModal, StatusBadge, Surface } from '@/shared/ui';

export function CounterDailyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [scrapNotes, setScrapNotes] = useState<ScrapNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [countsData, scrapData] = await Promise.allSettled([
        listStockCounts(isRefresh),
        listScrapNotes({ status: 'ALL' }, isRefresh),
      ]);

      if (countsData.status === 'fulfilled') setStockCounts(countsData.value || []);
      if (scrapData.status === 'fulfilled') setScrapNotes(scrapData.value || []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Counter Dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics calculation
  const pendingCounts = stockCounts.filter(
    (c) => c.status === 'DRAFT' || c.status === 'COUNTING' || c.status === 'WAITING_APPROVAL',
  );
  const completedCounts = stockCounts.filter((c) => c.status === 'APPROVED');

  const pendingScraps = scrapNotes.filter((s) => s.status === 'DRAFT');
  const approvedScraps = scrapNotes.filter((s) => s.status === 'APPROVED');
  const rejectedScraps = scrapNotes.filter((s) => s.status === 'REJECTED');

  const totalTasks = stockCounts.length + scrapNotes.length;
  const completedTasks = completedCounts.length + approvedScraps.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#ececf1]">
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={[colors.primary]}
          />
        }
      >
      {/* Top Header */}
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
      <View className="bg-[#4f46e5] rounded-3xl p-5 mb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-semibold text-white/80 uppercase">
              Bảng công việc Counter
            </Text>
            <Text className="text-xl font-extrabold text-white mt-0.5">
              Xin chào, {user?.name || 'Counter'} 👋
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
            <Text className="text-xs font-bold text-white">Tiến độ kiểm kê & xử lý hủy hàng</Text>
            <Text className="text-xs font-extrabold text-white">{completionRate}%</Text>
          </View>
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <View style={{ width: `${completionRate}%` }} className="h-full bg-white rounded-full" />
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Thông số nghiệp vụ
      </Text>
      <View className="flex-row gap-2.5 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/inventory')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Đợt Kiểm Kê</Text>
            <ClipboardCheck size={16} color="#4f46e5" />
          </View>
          <Text className="text-2xl font-extrabold text-[#4f46e5] my-0.5">{stockCounts.length}</Text>
          <Text className="text-[11px] font-semibold text-[#4338ca]">
            {pendingCounts.length} cần kiểm · {completedCounts.length} xong
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/scrap')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Phiếu Hủy Hàng</Text>
            <Trash2 size={16} color="#e11d48" />
          </View>
          <Text className="text-2xl font-extrabold text-[#e11d48] my-0.5">{scrapNotes.length}</Text>
          <Text className="text-[11px] font-semibold text-[#be123c]">
            {pendingScraps.length} chờ xử lý · {approvedScraps.length} xong
          </Text>
        </TouchableOpacity>
      </View>

      {/* To-Do List */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-xs font-bold text-[#6c7078] uppercase">
          Tác vụ kiểm & hủy hàng cần xử lý
        </Text>
        <Text className="text-xs font-bold text-[#4f46e5]">
          {pendingCounts.length + pendingScraps.length} việc tồn
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="py-10 items-center bg-white rounded-2xl border border-[#e4e5e9] mb-4">
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text className="text-xs text-[#6c7078] mt-2">Đang tải danh sách tác vụ Counter...</Text>
        </View>
      ) : (
        <View className="gap-3 mb-6">
          {/* Pending Stock Counts */}
          {pendingCounts.map((sc) => (
            <Surface key={sc.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/inventory')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <ClipboardCheck size={18} color="#4f46e5" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {sc.countNumber || `Kiểm kê #${sc.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge
                    label={sc.status === 'DRAFT' ? 'Nháp' : sc.status === 'COUNTING' ? 'Đang kiểm' : 'Chờ duyệt'}
                    variant={sc.status === 'COUNTING' ? 'warning' : 'neutral'}
                  />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1" numberOfLines={1}>
                  Ghi chú: {sc.notes || 'Không có ghi chú'} · {sc.items?.length || 0} sản phẩm
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#4f46e5] flex-1 mr-2" numberOfLines={1}>
                    Nghiệp vụ: Kiểm kê thực tế
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/inventory')}
                    className="bg-[#4f46e5] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Bắt đầu kiểm</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Pending Scrap Notes */}
          {pendingScraps.map((sn) => (
            <Surface key={sn.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/scrap')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Trash2 size={18} color="#e11d48" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      Phiếu hủy #{sn.id.substring(0, 6)}
                    </Text>
                  </View>
                  <StatusBadge label="Nháp" variant="neutral" />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1" numberOfLines={1}>
                  Lý do: {sn.note || sn.items?.[0]?.reason || 'Hàng hỏng / hết hạn'} · {sn.items?.length || 0} SP
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#e11d48] flex-1 mr-2" numberOfLines={1}>
                    Trạng thái: Cần xác nhận hủy
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/scrap')}
                    className="bg-[#e11d48] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Xem phiếu hủy</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Rejected Scraps */}
          {rejectedScraps.map((sn) => (
            <Surface key={sn.id} className="p-4 bg-[#fff5f5] border border-[#fecaca] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/scrap')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <AlertCircle size={18} color="#dc2626" />
                    <Text className="text-sm font-bold text-[#991b1b] flex-1" numberOfLines={1}>
                      Hủy bị từ chối: #{sn.id.substring(0, 6)}
                    </Text>
                  </View>
                  <StatusBadge label="Từ chối" variant="danger" />
                </View>
                <Text className="text-xs text-[#b91c1c] mt-1" numberOfLines={1}>
                  Lý do: {sn.rejectReason || 'Cần kiểm tra lại thông tin hủy'}
                </Text>
              </TouchableOpacity>
            </Surface>
          ))}

          {pendingCounts.length === 0 && pendingScraps.length === 0 && rejectedScraps.length === 0 && (
            <View className="bg-white p-6 rounded-2xl border border-[#e4e5e9] items-center">
              <CheckCircle2 size={36} color="#16a34a" />
              <Text className="text-sm font-extrabold text-[#101114] mt-2">
                Không có việc tồn đọng!
              </Text>
              <Text className="text-xs text-[#6c7078] text-center mt-1">
                Tất cả đợt kiểm kê và phiếu hủy hàng đã được xử lý hoàn tất.
              </Text>
            </View>
          )}
        </View>
      )}

      <QuickMenuModal visible={showQuickMenu} onClose={() => setShowQuickMenu(false)} />
    </ScrollView>
    </SafeAreaView>
  );
}
