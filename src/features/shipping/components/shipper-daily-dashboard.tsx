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
  MapPin,
  Menu as MenuIcon,
  RefreshCw,
  Search,
  Truck,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { listShipments } from '@/features/shipping/api/shipping-api';
import type { Shipment } from '@/features/shipping/api/shipping-api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/tokens';
import { QuickMenuModal, StatusBadge, Surface } from '@/shared/ui';

export function ShipperDailyDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listShipments(isRefresh);
      setShipments(data || []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu Shipper Dashboard:', err);
      setShipments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics calculation
  const pendingShipments = shipments.filter(
    (s) => s.status === 'PENDING' || s.status === 'ASSIGNED',
  );
  const inTransitShipments = shipments.filter((s) => s.status === 'IN_TRANSIT');
  const deliveredShipments = shipments.filter((s) => s.status === 'DELIVERED');
  const failedShipments = shipments.filter(
    (s) => s.status === 'FAILED' || s.status === 'RETURNED',
  );

  const totalShipments = shipments.length;
  const completedCount = deliveredShipments.length;
  const completionRate = totalShipments > 0 ? Math.round((completedCount / totalShipments) * 100) : 100;

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
      <View className="bg-[#16a34a] rounded-3xl p-5 mb-4 shadow-md">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-xs font-semibold text-white/80 uppercase">
              Bảng công việc Shipper
            </Text>
            <Text className="text-xl font-extrabold text-white mt-0.5">
              Xin chào, {user?.name || 'Shipper'} 👋
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
            <Text className="text-xs font-bold text-white">Tỷ lệ giao hàng thành công</Text>
            <Text className="text-xs font-extrabold text-white">{completionRate}%</Text>
          </View>
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <View style={{ width: `${completionRate}%` }} className="h-full bg-white rounded-full" />
          </View>
        </View>
      </View>

      {/* Metrics Grid */}
      <Text className="text-xs font-bold text-[#6c7078] uppercase mb-2 px-1">
        Thông số giao hàng
      </Text>
      <View className="flex-row gap-2.5 mb-4">
        <TouchableOpacity
          onPress={() => router.push('/shipping')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Đang Giao</Text>
            <Truck size={16} color="#d97706" />
          </View>
          <Text className="text-2xl font-extrabold text-[#d97706] my-0.5">{inTransitShipments.length}</Text>
          <Text className="text-[11px] font-semibold text-[#b45309]">
            {pendingShipments.length} chờ lấy hàng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/shipping')}
          activeOpacity={0.7}
          className="flex-1 bg-white p-3.5 rounded-2xl border border-[#e4e5e9] shadow-sm"
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-bold text-[#6c7078]">Đã Giao</Text>
            <CheckCircle2 size={16} color="#16a34a" />
          </View>
          <Text className="text-2xl font-extrabold text-[#16a34a] my-0.5">{deliveredShipments.length}</Text>
          <Text className="text-[11px] font-semibold text-[#15803d]">
            {failedShipments.length} giao thất bại
          </Text>
        </TouchableOpacity>
      </View>

      {/* To-Do List */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-xs font-bold text-[#6c7078] uppercase">
          Danh sách vận đơn cần giao
        </Text>
        <Text className="text-xs font-bold text-[#16a34a]">
          {pendingShipments.length + inTransitShipments.length} đơn cần đi
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="py-10 items-center bg-white rounded-2xl border border-[#e4e5e9] mb-4">
          <ActivityIndicator size="small" color="#16a34a" />
          <Text className="text-xs text-[#6c7078] mt-2">Đang tải danh sách vận đơn...</Text>
        </View>
      ) : (
        <View className="gap-3 mb-6">
          {/* In-Transit Shipments */}
          {inTransitShipments.map((shipment) => (
            <Surface key={shipment.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/shipping')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Truck size={18} color="#d97706" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {shipment.shipmentNumber || shipment.trackingNumber || `Vận đơn #${shipment.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge label="Đang giao" variant="warning" />
                </View>
                <View className="flex-row items-center gap-1 mt-1">
                  <MapPin size={13} color="#64748b" />
                  <Text className="text-xs text-[#6c7078] flex-1" numberOfLines={1}>
                    {shipment.recipientName ? `${shipment.recipientName} - ` : ''}{shipment.address || 'Địa chỉ giao hàng'}
                  </Text>
                </View>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#d97706] flex-1 mr-2" numberOfLines={1}>
                    Đơn vị: {shipment.carrierName || 'Tự giao nội bộ'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/shipping')}
                    className="bg-[#16a34a] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Cập nhật</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Pending / Assigned Shipments */}
          {pendingShipments.map((shipment) => (
            <Surface key={shipment.id} className="p-4 bg-white border border-[#e4e5e9] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/shipping')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Truck size={18} color="#16a34a" />
                    <Text className="text-sm font-bold text-[#101114] flex-1" numberOfLines={1}>
                      {shipment.shipmentNumber || shipment.trackingNumber || `Vận đơn #${shipment.id.substring(0, 6)}`}
                    </Text>
                  </View>
                  <StatusBadge label="Chờ lấy" variant="neutral" />
                </View>
                <View className="flex-row items-center gap-1 mt-1">
                  <MapPin size={13} color="#64748b" />
                  <Text className="text-xs text-[#6c7078] flex-1" numberOfLines={1}>
                    {shipment.recipientName ? `${shipment.recipientName} - ` : ''}{shipment.address || 'Địa chỉ giao hàng'}
                  </Text>
                </View>
                <View className="mt-3 pt-2.5 border-t border-[#f5f6f8] flex-row justify-between items-center gap-2">
                  <Text className="text-xs font-bold text-[#16a34a] flex-1 mr-2" numberOfLines={1}>
                    Đơn vị: {shipment.carrierName || 'Tự giao nội bộ'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/shipping')}
                    className="bg-[#16a34a] px-3.5 py-1.5 rounded-xl shrink-0"
                  >
                    <Text className="text-xs font-bold text-white">Bắt đầu giao</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Surface>
          ))}

          {/* Failed / Returned Shipments */}
          {failedShipments.map((shipment) => (
            <Surface key={shipment.id} className="p-4 bg-[#fff5f5] border border-[#fecaca] rounded-2xl">
              <TouchableOpacity onPress={() => router.push('/shipping')}>
                <View className="flex-row justify-between items-center mb-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <AlertCircle size={18} color="#dc2626" />
                    <Text className="text-sm font-bold text-[#991b1b] flex-1" numberOfLines={1}>
                      Giao thất bại: {shipment.shipmentNumber || shipment.id.substring(0, 6)}
                    </Text>
                  </View>
                  <StatusBadge label="Thất bại" variant="danger" />
                </View>
                <Text className="text-xs text-[#b91c1c] mt-1" numberOfLines={1}>
                  Người nhận: {shipment.recipientName || 'Khách hàng'}
                </Text>
              </TouchableOpacity>
            </Surface>
          ))}

          {inTransitShipments.length === 0 && pendingShipments.length === 0 && failedShipments.length === 0 && (
            <View className="bg-white p-6 rounded-2xl border border-[#e4e5e9] items-center">
              <CheckCircle2 size={36} color="#16a34a" />
              <Text className="text-sm font-extrabold text-[#101114] mt-2">
                Hoàn thành xuất sắc nhiệm vụ!
              </Text>
              <Text className="text-xs text-[#6c7078] text-center mt-1">
                Hiện không có vận đơn nào đang chờ giao hoặc tồn đọng.
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
