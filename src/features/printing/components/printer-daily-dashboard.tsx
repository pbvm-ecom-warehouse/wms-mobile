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
  Box,
  CheckCircle2,
  Clock,
  Menu as MenuIcon,
  Printer,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { listPrintJobs } from '@/features/printing/api/printing-api';
import type { PrintJob } from '@/features/printing/api/printing-api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/tokens';
import { QuickMenuModal, StatusBadge, Surface } from '@/shared/ui';

export function PrinterDailyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listPrintJobs(isRefresh);
      setPrintJobs(data || []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Printer Dashboard:', err);
      setPrintJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics calculation
  const pendingJobs = printJobs.filter((j) => j.status === 'PENDING');
  const inProgressJobs = printJobs.filter((j) => j.status === 'IN_PROGRESS');
  const completedJobs = printJobs.filter((j) => j.status === 'COMPLETED');

  const totalJobs = printJobs.length;
  const completedCount = completedJobs.length;
  const completionRate = totalJobs > 0 ? Math.round((completedCount / totalJobs) * 100) : 100;

  const totalCupsPrinted = completedJobs.reduce((acc, j) => acc + (j.quantity || 0), 0) +
    inProgressJobs.reduce((acc, j) => acc + (j.completedQuantity || 0), 0);

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
      <View className="bg-[#0284c7] rounded-3xl p-5 mb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-semibold text-white/80 uppercase">
              Bảng công việc Printer
            </Text>
            <Text className="text-xl font-extrabold text-white mt-0.5">
              Xin chào, {user?.name || 'Printer'} 👋
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
            <Text className="text-xs font-bold text-white">Tiến độ in ấn trong ngày</Text>
            <Text className="text-xs font-extrabold text-white">{completionRate}%</Text>
          </View>
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <View style={{ width: `${completionRate}%` }} className="h-full bg-white rounded-full" />
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Thông số in ấn ly
      </Text>
      <View className="flex-row gap-2.5 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/printing')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Đơn Đang In</Text>
            <Printer size={16} color="#0284c7" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0284c7] my-0.5">{inProgressJobs.length}</Text>
          <Text className="text-[11px] font-semibold text-[#0369a1]">
            {pendingJobs.length} đơn xếp hàng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/printing')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Tổng Sản Sản</Text>
            <CheckCircle2 size={16} color="#16a34a" />
          </View>
          <Text className="text-2xl font-extrabold text-[#16a34a] my-0.5">{totalCupsPrinted}</Text>
          <Text className="text-[11px] font-semibold text-[#15803d]">
            {completedJobs.length} lệnh đã xong
          </Text>
        </TouchableOpacity>
      </View>

      {/* To-Do List */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-xs font-bold text-[#6c7078] uppercase">
          Lệnh in ly cần thực hiện
        </Text>
        <Text className="text-xs font-bold text-[#0284c7]">
          {pendingJobs.length + inProgressJobs.length} lệnh chờ
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="py-10 items-center bg-white rounded-2xl border border-[#e4e5e9] mb-4">
          <ActivityIndicator size="small" color="#0284c7" />
          <Text className="text-xs text-[#6c7078] mt-2">Đang tải danh sách lệnh in...</Text>
        </View>
      ) : (
        <View className="gap-3 mb-6">
          {/* Active / In Progress Jobs */}
          {inProgressJobs.map((job) => (
            <Surface key={job.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/printing')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Printer size={18} color="#0284c7" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {job.jobCode || job.jobId || `Lệnh in #${job.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge label="Đang in" variant="warning" />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1" numberOfLines={1}>
                  Mẫu: {job.templateName || 'Mẫu tiêu chuẩn'} · Số lượng: {job.completedQuantity || 0}/{job.quantity || 0}
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#0284c7] flex-1 mr-2" numberOfLines={1}>
                    Trạng thái: Đang thực hiện in
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/printing')}
                    className="bg-[#0284c7] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Xem tiến độ</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Pending Queue Jobs */}
          {pendingJobs.map((job) => (
            <Surface key={job.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/printing')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Clock size={18} color="#64748b" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {job.jobCode || job.jobId || `Lệnh in #${job.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge label="Xếp hàng" variant="neutral" />
                </View>
                <Text className="text-xs text-[#6c7078] mt-1" numberOfLines={1}>
                  Mẫu: {job.templateName || 'Mẫu in tiêu chuẩn'} · Cần in: {job.quantity || 0} sản phẩm
                </Text>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#64748b] flex-1 mr-2" numberOfLines={1}>
                    Trạng thái: Đang chờ in
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/printing')}
                    className="bg-[#0284c7] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Bắt đầu in</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {inProgressJobs.length === 0 && pendingJobs.length === 0 && (
            <View className="bg-white p-6 rounded-2xl border border-[#e4e5e9] items-center">
              <CheckCircle2 size={36} color="#16a34a" />
              <Text className="text-sm font-extrabold text-[#101114] mt-2">
                Không có lệnh in tồn đọng!
              </Text>
              <Text className="text-xs text-[#6c7078] text-center mt-1">
                Tất cả các đơn in ly đã hoàn thành xuất sắc.
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
