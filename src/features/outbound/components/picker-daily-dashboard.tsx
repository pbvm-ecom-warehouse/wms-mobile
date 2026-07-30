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
  ArrowUpRight,
  Box,
  CheckCircle2,
  Menu as MenuIcon,
  Package,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { listGoodsIssues } from '@/features/outbound/api/outbound-api';
import type { GoodsIssue } from '@/features/outbound/api/outbound-api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/tokens';
import { QuickMenuModal, StatusBadge, Surface } from '@/shared/ui';

export function PickerDailyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [goodsIssues, setGoodsIssues] = useState<GoodsIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listGoodsIssues(isRefresh);
      setGoodsIssues(data || []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Picker Dashboard:', err);
      setGoodsIssues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics calculation
  const pendingIssues = goodsIssues.filter(
    (g) => g.status === 'DRAFT' || g.status === 'PICKING',
  );
  const packingIssues = goodsIssues.filter((g) => g.status === 'PACKING');
  const completedIssues = goodsIssues.filter(
    (g) => g.status === 'CONFIRMED' || g.status === 'SHIPPED',
  );

  const totalIssues = goodsIssues.length;
  const completedCount = completedIssues.length;
  const completionRate = totalIssues > 0 ? Math.round((completedCount / totalIssues) * 100) : 100;

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
      <View className="bg-[#ea580c] rounded-3xl p-5 mb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-semibold text-white/80 uppercase">
              Bảng công việc Picker
            </Text>
            <Text className="text-xl font-extrabold text-white mt-0.5">
              Xin chào, {user?.name || 'Picker'} 👋
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
            <Text className="text-xs font-bold text-white">Tiến độ soạn hàng hôm nay</Text>
            <Text className="text-xs font-extrabold text-white">{completionRate}%</Text>
          </View>
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <View style={{ width: `${completionRate}%` }} className="h-full bg-white rounded-full" />
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Thông số soạn hàng
      </Text>
      <View className="flex-row gap-2.5 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/outbound')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Cần Soạn</Text>
            <ArrowUpRight size={16} color="#ea580c" />
          </View>
          <Text className="text-2xl font-extrabold text-[#ea580c] my-0.5">{pendingIssues.length}</Text>
          <Text className="text-[11px] font-semibold text-[#c2410c]">
            {packingIssues.length} đơn đang đóng gói
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/outbound')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Đã Xuất Kho</Text>
            <CheckCircle2 size={16} color="#16a34a" />
          </View>
          <Text className="text-2xl font-extrabold text-[#16a34a] my-0.5">{completedIssues.length}</Text>
          <Text className="text-[11px] font-semibold text-[#15803d]">
            {totalIssues} tổng số phiếu xuất
          </Text>
        </TouchableOpacity>
      </View>

      {/* To-Do List */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-xs font-bold text-[#6c7078] uppercase">
          Phiếu xuất kho cần soạn
        </Text>
        <Text className="text-xs font-bold text-[#ea580c]">
          {pendingIssues.length + packingIssues.length} đơn chờ
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="py-10 items-center bg-white rounded-2xl border border-[#e4e5e9] mb-4">
          <ActivityIndicator size="small" color="#ea580c" />
          <Text className="text-xs text-[#6c7078] mt-2">Đang tải danh sách phiếu xuất...</Text>
        </View>
      ) : (
        <View className="gap-3 mb-6">
          {/* Pending Pick Tasks */}
          {pendingIssues.map((issue) => (
            <Surface key={issue.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/outbound')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <ArrowUpRight size={18} color="#ea580c" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {issue.issueNumber || `Phiếu xuất #${issue.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge
                    label={issue.status === 'DRAFT' ? 'Mới' : 'Đang lấy'}
                    variant={issue.status === 'DRAFT' ? 'neutral' : 'warning'}
                  />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1" numberOfLines={1}>
                  Khách: {issue.customerName || 'N/A'} · Đơn: {issue.orderNumber || issue.orderId || 'N/A'} · {issue.lines?.length || 0} mặt hàng
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#ea580c] flex-1 mr-2" numberOfLines={1}>
                    Nghiệp vụ: Soạn & lấy hàng
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/outbound')}
                    className="bg-[#ea580c] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Soạn hàng ngay</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Packing Issues */}
          {packingIssues.map((issue) => (
            <Surface key={issue.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/outbound')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Package size={18} color="#d97706" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {issue.issueNumber || `Phiếu xuất #${issue.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge label="Đóng gói" variant="warning" />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1" numberOfLines={1}>
                  Khách: {issue.customerName || 'N/A'} · Đóng gói {issue.lines?.length || 0} mặt hàng
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#d97706] flex-1 mr-2" numberOfLines={1}>
                    Trạng thái: Đang đóng gói
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/outbound')}
                    className="bg-[#d97706] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Xem chi tiết</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {pendingIssues.length === 0 && packingIssues.length === 0 && (
            <View className="bg-white p-6 rounded-2xl border border-[#e4e5e9] items-center">
              <CheckCircle2 size={36} color="#16a34a" />
              <Text className="text-sm font-extrabold text-[#101114] mt-2">
                Không có phiếu xuất tồn!
              </Text>
              <Text className="text-xs text-[#6c7078] text-center mt-1">
                Tất cả đơn soạn hàng đã được xử lý hoàn tất.
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
