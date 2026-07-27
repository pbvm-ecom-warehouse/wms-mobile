import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ArrowDownLeft, ArrowUpRight, Box, ClipboardList, LayoutDashboard, Printer, Truck, User as UserIcon } from 'lucide-react-native';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { GRNListScreen } from '../screens/inbound/GRNListScreen';
import { StockCountListScreen } from '../screens/inventory/StockCountListScreen';
import { GoodsIssueListScreen } from '../screens/outbound/GoodsIssueListScreen';
import { PrintJobListScreen } from '../screens/print-jobs/PrintJobListScreen';
import { ProductListScreen } from '../screens/products/ProductListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ShippingListScreen } from '../screens/shipping/ShippingListScreen';

const Tab = createBottomTabNavigator();

const commonScreenOptions = {
  headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitleStyle: { color: '#0f172a', fontWeight: '700' as const, fontSize: 18 },
  tabBarStyle: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 6,
    height: 60,
  },
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#8e8e93',
};

// 1. Admin & Manager Navigator
export const AdminNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        title: 'Tổng quan',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <LayoutDashboard size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Products"
      component={ProductListScreen}
      options={{
        title: 'Sản phẩm',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Box size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Inbound"
      component={GRNListScreen}
      options={{
        title: 'Nhập kho',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <ArrowDownLeft size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Outbound"
      component={GoodsIssueListScreen}
      options={{
        title: 'Xuất kho',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <ArrowUpRight size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Tài khoản',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <UserIcon size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// 2. Receiver Navigator
export const ReceiverNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="Inbound"
      component={GRNListScreen}
      options={{
        title: 'Nhập kho (GRN)',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <ArrowDownLeft size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Products"
      component={ProductListScreen}
      options={{
        title: 'Tra cứu tồn kho',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Box size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Tài khoản',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <UserIcon size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// 3. Picker Navigator
export const PickerNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="Outbound"
      component={GoodsIssueListScreen}
      options={{
        title: 'Soạn / Xuất hàng',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <ArrowUpRight size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Products"
      component={ProductListScreen}
      options={{
        title: 'Tra cứu vị trí',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Box size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Tài khoản',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <UserIcon size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// 4. Printer Navigator
export const PrinterNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="PrintJobs"
      component={PrintJobListScreen}
      options={{
        title: 'Đơn in ly',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Printer size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Products"
      component={ProductListScreen}
      options={{
        title: 'Kho phôi ly',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Box size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Tài khoản',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <UserIcon size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// 5. Counter Navigator
export const CounterNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="StockCount"
      component={StockCountListScreen}
      options={{
        title: 'Kiểm kê & Điều chỉnh',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <ClipboardList size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Products"
      component={ProductListScreen}
      options={{
        title: 'Tra cứu tồn kho',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Box size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Tài khoản',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <UserIcon size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

// 6. Shipper Navigator
export const ShipperNavigator: React.FC = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="Shipping"
      component={ShippingListScreen}
      options={{
        title: 'Vận đơn giao hàng',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <Truck size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Tài khoản',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <UserIcon size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);
