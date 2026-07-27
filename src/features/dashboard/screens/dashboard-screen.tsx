import React, { useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Box,
  CircleHelp,
  Clock3,
  PackageCheck,
  Printer,
  QrCode,
  Search,
  Truck,
  UserRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { inboundReceipts } from '@/features/inbound/data/mock-inbound';
import { outboundOrders } from '@/features/outbound/data/mock-outbound';
import { products } from '@/features/products/data/mock-products';
import { printJobs } from '@/features/printing/data/mock-printing';
import { deliveries } from '@/features/shipping/data/mock-shipping';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { IconButton, ListRow, Screen, Surface } from '@/shared/ui';

type Period = 'Hôm nay' | 'Tuần này';

export function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('Hôm nay');
  const totalStock = products.reduce((sum, product) => sum + product.available, 0);

  return (
    <Screen withTabBar>
      <View className="mb-5 flex-row items-center justify-between">
        <IconButton
          accessibilityLabel="Mở tài khoản"
          icon={<UserRound size={20} color={colors.text} />}
          onPress={() => router.push('/profile')}
        />
        <View className="items-center">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary-soft">
            <Box size={22} color={colors.primary} strokeWidth={2.3} />
          </View>
          <Text className="mt-1 text-[10px] font-semibold text-muted">PBVM WMS</Text>
        </View>
        <View className="flex-row gap-2">
          <IconButton
            accessibilityLabel="Thông báo (sắp có)"
            disabled
            notification
            icon={<Bell size={19} color={colors.text} />}
            onPress={() => undefined}
          />
          <IconButton
            accessibilityLabel="Tìm kiếm"
            icon={<Search size={20} color={colors.text} />}
            onPress={() => router.push('/products')}
          />
        </View>
      </View>

      <View className="mb-8 items-center">
        <View className="flex-row rounded-full bg-[#d7d8df] p-1">
          {(['Hôm nay', 'Tuần này'] as Period[]).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: period === item }}
              onPress={() => setPeriod(item)}
              className={`min-w-[90px] rounded-full px-5 py-2.5 ${period === item ? 'bg-white' : ''}`}
            >
              <Text className={`text-center text-xs font-semibold ${period === item ? 'text-primary' : 'text-ink'}`}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-8 items-center">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-medium text-muted">Tồn kho khả dụng</Text>
          <CircleHelp size={13} color={colors.textMuted} />
        </View>
        <Text className="mt-2 text-[36px] font-medium tracking-[-1.5px] text-ink">
          {totalStock.toLocaleString('vi-VN')}
        </Text>
        <Text className="mt-1 text-xs text-muted">đơn vị hàng hóa</Text>
      </View>

      <View className="mb-4 flex-row gap-3">
        <Surface className="min-h-[146px] flex-1 justify-between">
          <View className="flex-row justify-between">
            <Text className="text-[11px] text-muted">Tác vụ nhanh</Text>
            <QrCode size={18} color={colors.textMuted} />
          </View>
          <View>
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
              <ArrowDownLeft size={24} color={colors.primary} />
            </View>
            <Text className="text-base font-semibold leading-5 text-ink">Phiếu nhập{'\n'}sắp xử lý</Text>
          </View>
        </Surface>
        <Surface className="min-h-[146px] flex-1 justify-between">
          <View className="flex-row justify-between">
            <Text className="text-[11px] text-muted">Hướng dẫn</Text>
            <CircleHelp size={18} color={colors.textMuted} />
          </View>
          <View>
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
              <QrCode size={24} color={colors.primary} />
            </View>
            <Text className="text-base font-semibold leading-5 text-ink">Quét mã{'\n'}sắp có</Text>
          </View>
        </Surface>
      </View>

      <Surface className="mb-6 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
          <Clock3 size={22} color={colors.primary} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-semibold text-ink">Sắp tới</Text>
          <Text className="mt-0.5 text-xs text-muted">
            {inboundReceipts.filter((item) => item.status !== 'COMPLETED').length} phiếu nhập đang chờ
          </Text>
        </View>
      </Surface>

      <Text className="mb-3 px-1 text-xl font-semibold tracking-[-0.4px] text-ink">
        Hoạt động hôm nay
      </Text>
      <Surface>
        <ListRow icon={<ArrowDownLeft size={19} color={colors.primary} />} title="Phiếu nhập kho" subtitle="Đang xử lý và chờ tiếp nhận" meta={`${inboundReceipts.length} đơn`} />
        <ListRow icon={<Printer size={19} color={colors.primary} />} title="Đơn in ly" subtitle="Theo dõi tiến độ in" meta={`${printJobs.length} đơn`} />
        <ListRow icon={<Truck size={19} color={colors.primary} />} title="Vận đơn giao hàng" subtitle="Sẵn sàng và đang giao" meta={`${deliveries.length} đơn`} />
        <ListRow icon={<ArrowUpRight size={19} color={colors.primary} />} title="Phiếu xuất kho" subtitle="Đang chờ và đang soạn" meta={`${outboundOrders.length} đơn`} />
      </Surface>

      <View className="mt-5 flex-row items-center justify-center gap-1">
        <PackageCheck size={13} color={colors.primary} />
        <Text className="text-xs text-muted">
          {user?.name || 'Nhân viên kho'} · Hệ thống hoạt động tốt
        </Text>
      </View>
    </Screen>
  );
}
