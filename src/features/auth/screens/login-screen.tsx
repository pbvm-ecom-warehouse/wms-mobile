import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import axios from 'axios';
import { AlertCircle, LockKeyhole, Package, UserRound } from 'lucide-react-native';
import { useAuth } from '@/features/auth/context/auth-context';
import { colors } from '@/shared/theme/tokens';
import { AppButton, Screen, Surface } from '@/shared/ui';

function getLoginError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    }

    const status = error.response.status;
    const data = error.response.data as { message?: string | string[]; code?: string } | undefined;

    if (
      status === 401 ||
      status === 400 ||
      data?.code === 'AUTH_INVALID_CREDENTIALS' ||
      (typeof data?.message === 'string' &&
        (data.message.toLowerCase().includes('sai') ||
          data.message.toLowerCase().includes('unauthorized') ||
          data.message.toLowerCase().includes('invalid') ||
          data.message.toLowerCase().includes('password') ||
          data.message.toLowerCase().includes('user')))
    ) {
      return 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    }

    const message = data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
}

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!username.trim() || !password) {
      const emptyMsg = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
      setError(emptyMsg);
      return;
    }
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (loginError) {
      const errMsg = getLoginError(loginError);
      setError(errMsg);
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
        <Text className="text-[28px] font-semibold tracking-[-1px] text-ink">StockMate</Text>
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
          <View
            accessibilityRole="alert"
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 16,
              backgroundColor: colors.dangerSoft,
              padding: 14,
              borderWidth: 1,
              borderColor: '#fca5a5',
            }}
          >
            <AlertCircle size={20} color={colors.danger} />
            <Text
              style={{
                marginLeft: 10,
                flex: 1,
                fontSize: 14,
                fontWeight: '500',
                lineHeight: 20,
                color: colors.danger,
              }}
            >
              {error}
            </Text>
          </View>
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
