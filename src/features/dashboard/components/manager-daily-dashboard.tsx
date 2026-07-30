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
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Layers,
  Menu as MenuIcon,
  PackageCheck,
  Printer,
  RefreshCw,
  ShoppingCart,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { listGoodsReceiptNotes } from '@/features/inbound/api/grn-api';
import { listGoodsIssues } from '@/features/outbound/api/outbound-api';
import { listProducts } from '@/features/products/api/products-api';
import { listPrintJobs } from '@/features/printing/api/printing-api';
import { listShipments } from '@/features/shipping/api/shipping-api';
import { listScrapNotes } from '@/features/scrap/api/scrap-api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/tokens';
import { QuickMenuModal, Surface } from '@/shared/ui';

export function ManagerDailyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [stockTotal, setStockTotal] = useState<number>(0);
  const [grnCount, setGrnCount] = useState<number>(0);
  const [issueCount, setIssueCount] = useState<number>(0);
  const [printCount, setPrintCount] = useState<number>(0);
  const [shipCount, setShipCount] = useState<number>(0);
  const [scrapCount, setScrapCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [prods, grns, issues, prints, ships, scraps] = await Promise.allSettled([
        listProducts(isRefresh),
        listGoodsReceiptNotes({ status: 'ALL' }, isRefresh),
        listGoodsIssues(isRefresh),
        listPrintJobs(isRefresh),
        listShipments(isRefresh),
        listScrapNotes({ status: 'ALL' }, isRefresh),
      ]);

      if (prods.status === 'fulfilled') {
        const sum = prods.value.reduce(
          (acc, item) => acc + (item.availableQty ?? item.quantityOnHand ?? 0),
          0,
        );
        setStockTotal(sum);
      }
      if (grns.status === 'fulfilled') setGrnCount(grns.value.length);
      if (issues.status === 'fulfilled') setIssueCount(issues.value.length);
      if (prints.status === 'fulfilled') setPrintCount(prints.value.length);
      if (ships.status === 'fulfilled') setShipCount(ships.value.length);
      if (scraps.status === 'fulfilled') setScrapCount(scraps.value.length);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Manager Dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const roleName = user?.role?.toUpperCase() === 'ADMIN' ? 'Admin' : 'Manager';

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
      <View className="bg-[#0f172a] rounded-3xl p-5 mb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Bảng điều hành {roleName}
            </Text>
            <Text className="text-xl font-extrabold text-white mt-0.5">
              Xin chào, {user?.name || roleName} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchData(true)}
            className="p-2 bg-white/10 rounded-full active:opacity-80"
          >
            <RefreshCw size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-white/80 font-medium mb-3">{todayStr}</Text>

        {/* Total Stock Summary Card inside Banner */}
        <View className="bg-white/10 p-3.5 rounded-2xl border border-white/15">
          <Text className="text-[11px] font-bold text-white/70 uppercase">Tồn kho khả dụng toàn hệ thống</Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-3xl font-black text-white">
              {loading && !refreshing ? '...' : stockTotal.toLocaleString('vi-VN')}
            </Text>
            <Text className="text-xs font-semibold text-white/80">đơn vị hàng hóa</Text>
          </View>
        </View>
      </View>

      {/* Operational Metrics Grid */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Thông số vận hành kho
      </Text>
      <View className="grid grid-cols-2 gap-2.5 mb-4 flex-row flex-wrap">
        <TouchableOpacity
          onPress={() => router.push('/inbound')}
          activeOpacity={0.7}
          className="w-[48.5%] bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Phiếu Nhập Kho</Text>
            <ArrowDownLeft size={16} color="#0878f9" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0878f9] my-0.5">{grnCount}</Text>
          <Text className="text-[11px] font-semibold text-[#15803d]">Đang trong hệ thống</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/outbound')}
          activeOpacity={0.7}
          className="w-[48.5%] bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Phiếu Xuất Kho</Text>
            <ArrowUpRight size={16} color="#ea580c" />
          </View>
          <Text className="text-2xl font-extrabold text-[#ea580c] my-0.5">{issueCount}</Text>
          <Text className="text-[11px] font-semibold text-[#c2410c]">Đang xử lý & soạn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/printing')}
          activeOpacity={0.7}
          className="w-[48.5%] bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Lệnh In Ly</Text>
            <Printer size={16} color="#0284c7" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0284c7] my-0.5">{printCount}</Text>
          <Text className="text-[11px] font-semibold text-[#0369a1]">Theo dõi tiến độ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/shipping')}
          activeOpacity={0.7}
          className="w-[48.5%] bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Vận Đơn Giao</Text>
            <Truck size={16} color="#16a34a" />
          </View>
          <Text className="text-2xl font-extrabold text-[#16a34a] my-0.5">{shipCount}</Text>
          <Text className="text-[11px] font-semibold text-[#15803d]">Đang giao & hoàn tất</Text>
        </TouchableOpacity>
      </View>

      {/* System Activity Overview */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Hoạt động & Phân hệ hệ thống
      </Text>

      {loading && !refreshing ? (
        <View className="py-10 items-center bg-white rounded-2xl border border-[#e4e5e9] mb-4">
          <ActivityIndicator size="small" color="#0f172a" />
          <Text className="text-xs text-[#6c7078] mt-2">Đang tải dữ liệu tổng quan kho...</Text>
        </View>
      ) : (
        <View className="gap-2.5 mb-6">
          <Surface className="p-0 overflow-hidden bg-white border border-[#e4e5e9] rounded-2xl">
            <TouchableOpacity
              onPress={() => router.push('/orders')}
              className="p-3.5 flex-row items-center justify-between active:bg-[#f8fafc]"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#2563eb]/10 items-center justify-center">
                  <ShoppingCart size={20} color="#2563eb" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#101114]">Quản lý Đặt Hàng</Text>
                  <Text className="text-xs text-[#6c7078]">Tạo & theo dõi đơn hàng nhà cung cấp</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#2563eb]">Đặt mua</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-[#f1f5f9] ml-16" />

            <TouchableOpacity
              onPress={() => router.push('/inbound')}
              className="p-3.5 flex-row items-center justify-between active:bg-[#f8fafc]"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#0878f9]/10 items-center justify-center">
                  <ArrowDownLeft size={20} color="#0878f9" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#101114]">Quản lý Nhập Kho</Text>
                  <Text className="text-xs text-[#6c7078]">Tiếp nhận phiếu nhập & nhà cung cấp</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#0878f9]">{grnCount} đơn</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-[#f1f5f9] ml-16" />

            <TouchableOpacity
              onPress={() => router.push('/outbound')}
              className="p-3.5 flex-row items-center justify-between active:bg-[#f8fafc]"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#ea580c]/10 items-center justify-center">
                  <ArrowUpRight size={20} color="#ea580c" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#101114]">Quản lý Xuất Kho</Text>
                  <Text className="text-xs text-[#6c7078]">Soạn hàng & xuất đơn khách hàng</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#ea580c]">{issueCount} đơn</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-[#f1f5f9] ml-16" />

            <TouchableOpacity
              onPress={() => router.push('/putaway')}
              className="p-3.5 flex-row items-center justify-between active:bg-[#f8fafc]"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#d97706]/10 items-center justify-center">
                  <Layers size={20} color="#d97706" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#101114]">Cất Hàng Vào Kệ</Text>
                  <Text className="text-xs text-[#6c7078]">Gợi ý vị trí & xếp kệ thông minh</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#d97706]">Sơ đồ kệ</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-[#f1f5f9] ml-16" />

            <TouchableOpacity
              onPress={() => router.push('/inventory')}
              className="p-3.5 flex-row items-center justify-between active:bg-[#f8fafc]"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#4f46e5]/10 items-center justify-center">
                  <ClipboardCheck size={20} color="#4f46e5" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#101114]">Kiểm Kê Kho</Text>
                  <Text className="text-xs text-[#6c7078]">Đếm thực tế & đối soát tồn kho</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#4f46e5]">Đối soát</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            <View className="h-[1px] bg-[#f1f5f9] ml-16" />

            <TouchableOpacity
              onPress={() => router.push('/scrap')}
              className="p-3.5 flex-row items-center justify-between active:bg-[#f8fafc]"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#dc2626]/10 items-center justify-center">
                  <Trash2 size={20} color="#dc2626" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#101114]">Báo Hỏng & Hủy Hàng</Text>
                  <Text className="text-xs text-[#6c7078]">Duyệt & ghi nhận phế phẩm kho</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#dc2626]">{scrapCount} phiếu</Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          </Surface>
        </View>
      )}

      {/* Footer System Status */}
      <View className="mt-2 mb-6 flex-row items-center justify-center gap-1.5">
        <PackageCheck size={14} color="#16a34a" />
        <Text className="text-xs text-[#6c7078] font-medium">
          {user?.name || roleName} · Hệ thống điều hành hoạt động tốt
        </Text>
      </View>

      <QuickMenuModal visible={showQuickMenu} onClose={() => setShowQuickMenu(false)} />
    </ScrollView>
    </SafeAreaView>
  );
}
