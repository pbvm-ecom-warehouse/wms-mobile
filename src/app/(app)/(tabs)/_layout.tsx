import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  ClipboardCheck,
  Layers,
  LayoutDashboard,
  Printer,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessTab, type AppTab } from '@/features/auth/model/role-navigation';
import { colors } from '@/shared/theme/tokens';

const screens: {
  name: AppTab;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { name: 'dashboard', title: 'Tổng quan', icon: LayoutDashboard },
  { name: 'products', title: 'Sản phẩm', icon: Box },
  { name: 'inbound', title: 'Nhập kho', icon: ArrowDownLeft },
  { name: 'putaway', title: 'Cất hàng', icon: Layers },
  { name: 'scrap', title: 'Hủy hàng', icon: Trash2 },
  { name: 'outbound', title: 'Xuất kho', icon: ArrowUpRight },
  { name: 'printing', title: 'In ly', icon: Printer },
  { name: 'inventory', title: 'Kiểm kê', icon: ClipboardCheck },
  { name: 'shipping', title: 'Giao hàng', icon: Truck },
  { name: 'profile', title: 'Tài khoản', icon: UserRound },
];

export default function TabsLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 68,
          paddingTop: 7,
          paddingBottom: 7,
          borderTopWidth: 0,
          borderRadius: 24,
          backgroundColor: colors.surface,
          elevation: 10,
          shadowColor: '#6b7280',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
        },
        tabBarItemStyle: { borderRadius: 18 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarActiveBackgroundColor: colors.primarySoft,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      {screens.map((screen) => {
        const Icon = screen.icon;
        const allowed = user ? canAccessTab(user.role, screen.name) : false;
        return (
          <Tabs.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.title,
              href: allowed ? `/${screen.name}` : null,
              tabBarIcon: ({ color, size }) => <Icon color={String(color)} size={size} />,
            }}
          />
        );
      })}
    </Tabs>
  );
}
