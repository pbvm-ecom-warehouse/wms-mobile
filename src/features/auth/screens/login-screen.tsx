import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AxiosError } from 'axios';
import { LockKeyhole, Package, UserRound } from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { AppButton, Screen, Surface } from '@/shared/ui';

function getLoginError(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return 'Không thể đăng nhập. Vui lòng kiểm tra tài khoản và thử lại.';
}

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (loginError) {
      setError(getLoginError(loginError));
    }
  }

  return (
    <Screen
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      className="py-10"
    >
      <View className="mb-8 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-[28px] bg-primary-soft">
          <Package size={38} color={colors.primary} strokeWidth={1.9} />
        </View>
        <Text className="text-[28px] font-semibold tracking-[-1px] text-ink">PBVM WMS</Text>
        <Text className="mt-1 text-sm text-muted">Vận hành kho gọn, rõ và đúng vai trò</Text>
      </View>

      <Surface className="p-5">
        <Text className="mb-1 text-xl font-semibold text-ink">Đăng nhập</Text>
        <Text className="mb-6 text-sm leading-5 text-muted">
          Sử dụng tài khoản nhân sự đã được cấp.
        </Text>

        <Text className="mb-2 text-xs font-semibold text-muted">TÊN ĐĂNG NHẬP</Text>
        <View className="mb-4 min-h-12 flex-row items-center rounded-2xl bg-surface-muted px-4">
          <UserRound size={19} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Tên đăng nhập"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            placeholderTextColor={colors.textMuted}
            className="ml-3 flex-1 py-3 text-base text-ink"
          />
        </View>

        <Text className="mb-2 text-xs font-semibold text-muted">MẬT KHẨU</Text>
        <View className="min-h-12 flex-row items-center rounded-2xl bg-surface-muted px-4">
          <LockKeyhole size={19} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            className="ml-3 flex-1 py-3 text-base text-ink"
            onSubmitEditing={handleLogin}
          />
        </View>

        {error ? (
          <Text accessibilityRole="alert" className="mt-3 text-sm leading-5 text-danger">
            {error}
          </Text>
        ) : null}

        <View className="mt-6">
          <AppButton label="Đăng nhập" loading={isLoading} onPress={handleLogin} />
        </View>
      </Surface>

      <Text className="mt-6 text-center text-xs text-muted">
        Hệ thống quản lý kho và chuỗi cung ứng
      </Text>
    </Screen>
  );
}
