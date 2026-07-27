import React from 'react';
import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { AppButton, AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';

export function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();

  return (
    <Screen withTabBar>
      <AppHeader title="Tài khoản" subtitle="Thông tin và quyền truy cập" />
      <Surface className="mb-4 items-center py-6">
        <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
          <UserRound size={34} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold text-ink">{user?.name || 'Tài khoản WMS'}</Text>
        <Text className="mt-0.5 text-sm text-muted">@{user?.username || 'user'}</Text>
        <View className="mt-3">
          <StatusBadge label={user?.role || 'Chưa xác định'} variant="neutral" />
        </View>
      </Surface>

      <Surface className="mb-4">
        <ListRow
          icon={<Mail size={18} color={colors.primary} />}
          title="Email"
          subtitle={user?.email || 'Chưa cập nhật'}
        />
        <ListRow
          icon={<Phone size={18} color={colors.primary} />}
          title="Số điện thoại"
          subtitle={user?.phone || 'Chưa cập nhật'}
        />
        <ListRow
          icon={<ShieldCheck size={18} color={colors.primary} />}
          title="Bộ phận"
          subtitle="Vận hành kho WMS"
        />
      </Surface>

      <AppButton
        label="Đăng xuất"
        variant="danger"
        loading={isLoading}
        onPress={logout}
      />
    </Screen>
  );
}
