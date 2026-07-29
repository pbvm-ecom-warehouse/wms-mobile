import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  ChevronRight,
  ClipboardCheck,
  Layers,
  LogOut,
  Menu,
  Printer,
  Trash2,
  Truck,
  UserRound,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { canRoleAccessRoute } from '@/features/auth/model/role-navigation';
import { colors } from '@/shared/theme/tokens';

interface QuickMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

const mainNavItems = [
  {
    key: 'inbound',
    title: 'Phiếu Nhập',
    subtitle: 'Phiếu nhập & Tiếp nhận',
    icon: ArrowDownLeft,
    color: '#0878f9',
    bgColor: '#eff6ff',
    route: '/inbound',
  },
  {
    key: 'putaway',
    title: 'Cất Hàng',
    subtitle: 'Sơ đồ & Xếp khoang kệ',
    icon: Layers,
    color: '#d97706',
    bgColor: '#fef3c7',
    route: '/putaway',
  },
  {
    key: 'outbound',
    title: 'Phiếu Xuất',
    subtitle: 'Soạn hàng & Đơn xuất',
    icon: ArrowUpRight,
    color: '#8b5cf6',
    bgColor: '#f3e8ff',
    route: '/outbound',
  },
  {
    key: 'inventory',
    title: 'Kiểm Kê Kho',
    subtitle: 'Đếm hàng & Đối soát',
    icon: ClipboardCheck,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    route: '/inventory',
  },
];

const toolNavItems = [
  {
    key: 'products',
    title: 'Tra Cứu Sản Phẩm',
    subtitle: 'Tồn kho thực & Vị trí',
    icon: Box,
    color: '#4f46e5',
    bgColor: '#eef2ff',
    route: '/products',
  },
  {
    key: 'printing',
    title: 'In Tem & Mã Vạch',
    subtitle: 'In tem ly & Nhãn dán',
    icon: Printer,
    color: '#0284c7',
    bgColor: '#e0f2fe',
    route: '/printing',
  },
  {
    key: 'shipping',
    title: 'Vận Đơn Giao Hàng',
    subtitle: 'Theo dõi đơn giao',
    icon: Truck,
    color: '#ca8a04',
    bgColor: '#fef9c3',
    route: '/shipping',
  },
  {
    key: 'scrap',
    title: 'Báo Hỏng / Hủy Hàng',
    subtitle: 'Ghi nhận phế phẩm kho',
    icon: Trash2,
    color: '#dc2626',
    bgColor: '#ffebeb',
    route: '/scrap',
  },
];

export function QuickMenuModal({ visible, onClose }: QuickMenuModalProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!visible) return null;

  const allowedMainItems = mainNavItems.filter((item) => canRoleAccessRoute(user?.role, item.key));
  const allowedToolItems = toolNavItems.filter((item) => canRoleAccessRoute(user?.role, item.key));

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      logout();
    }, 150);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/60 flex-row justify-start"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="w-[82%] max-w-[320px] bg-white h-full shadow-2xl justify-between"
        >
          <View className="flex-1">
            {/* Sidebar Top Header Banner */}
            <View className="bg-[#0878f9] pt-12 pb-5 px-5 rounded-br-3xl">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center border border-white/30">
                    <Box size={22} color="#ffffff" strokeWidth={2.3} />
                  </View>
                  <View>
                    <Text className="text-lg font-black text-white">Stock Mate</Text>
                    <Text className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                      WMS System Mobile
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} className="p-1.5 bg-white/20 rounded-full">
                  <X size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* User Profile Card inside Sidebar Header */}
              <View className="bg-white/15 p-3 rounded-2xl border border-white/20 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-white/30 items-center justify-center">
                  <Text className="text-base font-extrabold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-white" numberOfLines={1}>
                    {user?.name || 'Nhân viên kho'}
                  </Text>
                  <View className="self-start bg-white/25 px-2 py-0.5 rounded-md mt-0.5">
                    <Text className="text-[10px] font-bold text-white uppercase">
                      Role: {user?.role || 'User'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sidebar Navigation Items */}
            <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
              {/* Section 1: Main Business Features */}
              {allowedMainItems.length > 0 ? (
                <>
                  <Text className="text-[11px] font-extrabold text-[#94a3b8] uppercase mb-2 px-1 tracking-wider">
                    Nghiệp vụ chính
                  </Text>
                  <View className="gap-1 mb-4">
                    {allowedMainItems.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => handleNavigate(item.route)}
                          activeOpacity={0.7}
                          className="p-2.5 rounded-2xl flex-row items-center gap-3 active:bg-[#f1f5f9]"
                        >
                          <View
                            style={{ backgroundColor: item.bgColor }}
                            className="w-10 h-10 rounded-xl items-center justify-center"
                          >
                            <IconComp size={20} color={item.color} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-bold text-[#0f172a]">{item.title}</Text>
                            <Text className="text-[10px] text-[#64748b] mt-0.5">{item.subtitle}</Text>
                          </View>
                          <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {/* Section 2: Tools & Inventory */}
              {allowedToolItems.length > 0 ? (
                <>
                  <Text className="text-[11px] font-extrabold text-[#94a3b8] uppercase mb-2 px-1 tracking-wider">
                    Công cụ & Báo cáo
                  </Text>
                  <View className="gap-1 mb-6">
                    {allowedToolItems.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => handleNavigate(item.route)}
                          activeOpacity={0.7}
                          className="p-2.5 rounded-2xl flex-row items-center gap-3 active:bg-[#f1f5f9]"
                        >
                          <View
                            style={{ backgroundColor: item.bgColor }}
                            className="w-10 h-10 rounded-xl items-center justify-center"
                          >
                            <IconComp size={20} color={item.color} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-bold text-[#0f172a]">{item.title}</Text>
                            <Text className="text-[10px] text-[#64748b] mt-0.5">{item.subtitle}</Text>
                          </View>
                          <ChevronRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>

          {/* Sidebar Footer (Profile & Logout) */}
          <View className="p-4 border-t border-[#f1f5f9] bg-[#f8fafc] gap-2">
            <TouchableOpacity
              onPress={() => handleNavigate('/profile')}
              className="p-3 bg-white border border-[#e2e8f0] rounded-2xl flex-row items-center gap-3 active:bg-[#f1f5f9]"
            >
              <View className="w-8 h-8 rounded-xl bg-[#eff6ff] items-center justify-center">
                <UserRound size={17} color="#0878f9" />
              </View>
              <Text className="text-xs font-bold text-[#0f172a] flex-1">Thông tin cá nhân</Text>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="p-3 bg-[#ffebeb] border border-[#fecaca] rounded-2xl flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <LogOut size={16} color="#dc2626" />
              <Text className="text-xs font-bold text-[#dc2626]">Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
