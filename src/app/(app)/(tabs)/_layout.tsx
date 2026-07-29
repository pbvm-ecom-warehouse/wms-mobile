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
  icon: React.ComponentType<any>;
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
          backgroundColor: '#ffffff',
          height: 60,
          borderTopWidth: 1,
          borderColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#0878f9',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      {screens.map((screen) => {
        const isAccessible = canAccessTab(user?.role || ('' as any), screen.name);
        const IconComponent = screen.icon;

        return (
          <Tabs.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.title,
              href: isAccessible ? undefined : null,
              tabBarIcon: ({ color, size }) => (
                <IconComponent size={size || 20} color={color} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
