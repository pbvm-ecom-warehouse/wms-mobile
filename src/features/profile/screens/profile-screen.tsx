import React from 'react';
import { Text, View } from 'react-native';
import { KeyRound, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { AppButton, AppHeader, ListRow, Screen, StatusBadge, Surface } from '@/shared/ui';

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();

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
        <ListRow
          icon={<KeyRound size={18} color={colors.primary} />}
          title="Đổi mật khẩu"
          subtitle="Thay đổi mật khẩu tài khoản"
          onPress={() => router.push('/change-password')}
        />
      </Surface>

      <AppButton
        label="Đăng xuất"
        variant="danger"
        loading={isAuthLoading}
        onPress={logout}
      />
    </Screen>
  );
}
