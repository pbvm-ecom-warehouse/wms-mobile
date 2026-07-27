import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, BarChart3, Box, CheckCircle2, Clock, Printer, QrCode, Truck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { MOCK_GOODS_ISSUES, MOCK_GRN_LIST, MOCK_PRINT_JOBS, MOCK_PRODUCTS, MOCK_SHIPPING_DELIVERIES } from '../../mock/data';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-slate-950 px-4 py-4">
      {/* Welcome Banner */}
      <View className="bg-gradient-to-r bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5">
        <Text className="text-slate-400 text-xs font-semibold uppercase">Tổng quan kho WMS</Text>
        <Text className="text-2xl font-bold text-white mt-1">Xin chào, {user?.name || 'Quản trị viên'} 👋</Text>
        <Text className="text-sky-400 text-xs font-medium mt-1">
          Vai trò: {user?.role} • Trạng thái hệ thống: Hoạt động tốt
        </Text>
      </View>

      {/* Grid Metrics */}
      <View className="flex-row flex-wrap justify-between gap-y-3 mb-5">
        <View className="w-[48%] bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-400 text-xs font-medium">Nhập kho hôm nay</Text>
            <View className="p-2 bg-emerald-500/10 rounded-xl">
              <ArrowDownLeft size={18} color="#10b981" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-white">{MOCK_GRN_LIST.length} Đơn</Text>
          <Text className="text-emerald-400 text-xs mt-1">1 Đơn đang xử lý</Text>
        </View>

        <View className="w-[48%] bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-400 text-xs font-medium">Xuất kho hôm nay</Text>
            <View className="p-2 bg-sky-500/10 rounded-xl">
              <ArrowUpRight size={18} color="#0284c7" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-white">{MOCK_GOODS_ISSUES.length} Đơn</Text>
          <Text className="text-sky-400 text-xs mt-1">1 Đơn đang soạn hàng</Text>
        </View>

        <View className="w-[48%] bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-400 text-xs font-medium">Đơn in ly</Text>
            <View className="p-2 bg-purple-500/10 rounded-xl">
              <Printer size={18} color="#a855f7" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-white">{MOCK_PRINT_JOBS.length} Đơn</Text>
          <Text className="text-purple-400 text-xs mt-1">3.000 Ly đang in</Text>
        </View>

        <View className="w-[48%] bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-400 text-xs font-medium">Vận đơn giao hàng</Text>
            <View className="p-2 bg-orange-500/10 rounded-xl">
              <Truck size={18} color="#f97316" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-white">{MOCK_SHIPPING_DELIVERIES.length} Vận đơn</Text>
          <Text className="text-orange-400 text-xs mt-1">1 Đơn đang giao</Text>
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5">
        <Text className="text-white font-bold text-base mb-3">Tác Vụ Nhanh</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity className="items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 flex-1 mr-2">
            <QrCode size={24} color="#38bdf8" />
            <Text className="text-slate-300 text-xs font-medium mt-2">Quét Mã QR</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 flex-1 mr-2">
            <Box size={24} color="#10b981" />
            <Text className="text-slate-300 text-xs font-medium mt-2">Tồn Kho</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 flex-1">
            <BarChart3 size={24} color="#a855f7" />
            <Text className="text-slate-300 text-xs font-medium mt-2">Báo Cáo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity List */}
      <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-8">
        <Text className="text-white font-bold text-base mb-4">Hoạt Động Gần Đây</Text>
        
        <View className="flex-row items-center mb-4 pb-3 border-b border-slate-800">
          <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center mr-3">
            <ArrowDownLeft size={20} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">Tiếp nhận nhập kho PNK-20260727-01</Text>
            <Text className="text-slate-500 text-xs">NCC: Công ty Bao Bì Xanh • 3.200 cái</Text>
          </View>
          <Text className="text-slate-400 text-xs">09:30</Text>
        </View>

        <View className="flex-row items-center mb-4 pb-3 border-b border-slate-800">
          <View className="w-10 h-10 rounded-xl bg-purple-500/10 items-center justify-center mr-3">
            <Printer size={20} color="#a855f7" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">Đang in ly IN-20260727-01</Text>
            <Text className="text-slate-500 text-xs">Logo Phê La • Tiến độ 1.800/3.000</Text>
          </View>
          <Text className="text-slate-400 text-xs">08:00</Text>
        </View>

        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-orange-500/10 items-center justify-center mr-3">
            <Truck size={20} color="#f97316" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">Đang giao vận đơn VD-20260727-991</Text>
            <Text className="text-slate-500 text-xs">Khách hàng: Anh Bảo (Q.3)</Text>
          </View>
          <Text className="text-slate-400 text-xs">08:30</Text>
        </View>
      </View>
    </ScrollView>
  );
};
