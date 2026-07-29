import React, { useEffect, useState } from 'react';
import { BackHandler, Text, TextInput, View } from 'react-native';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle2, KeyRound, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { authApi } from '@/features/auth/api/auth-api';
import { colors } from '@/shared/theme/tokens';
import { AppAlertModal, AppAlertModalProps, AppButton, AppHeader, IconButton, Screen, Surface } from '@/shared/ui';

export function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom App UI Alert state
  const [alertState, setAlertState] = useState<AppAlertModalProps | null>(null);
  const showAlert = (config: Omit<AppAlertModalProps, 'visible'>) => {
    setAlertState({ ...config, visible: true, onClose: () => setAlertState(null) });
  };

  function handleGoBack() {
    router.replace('/profile');
  }

  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  async function handleChangePassword() {
    setError(null);
    setSuccess(null);

    if (!oldPassword) {
      const msg = 'Vui lòng nhập mật khẩu hiện tại.';
      setError(msg);
      return;
    }

    if (!newPassword) {
      const msg = 'Vui lòng nhập mật khẩu mới.';
      setError(msg);
      return;
    }

    if (newPassword.length < 8) {
      const msg = 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.';
      setError(msg);
      return;
    }

    if (oldPassword === newPassword) {
      const msg = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
      setError(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Mật khẩu xác nhận không khớp.';
      setError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      const okMsg = 'Đổi mật khẩu thành công!';
      setSuccess(okMsg);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert({
        title: 'Thành công',
        message: okMsg,
        variant: 'success',
        confirmText: 'OK',
        onConfirm: () => {
          setAlertState(null);
          handleGoBack();
        },
      });
    } catch (err: unknown) {
      let errMsg = 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string | string[] } | undefined)?.message;
        if (Array.isArray(msg)) {
          errMsg = msg.join(', ');
        } else if (typeof msg === 'string' && msg.trim()) {
          errMsg = msg;
        } else if (err.response?.status === 401) {
          errMsg = 'Mật khẩu hiện tại không chính xác.';
        } else if (!err.response) {
          errMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        }
      } else if (err instanceof Error && err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <AppHeader
        title="Đổi mật khẩu"
        subtitle="Cập nhật mật khẩu tài khoản nhân sự"
        leading={
          <IconButton
            accessibilityLabel="Quay lại tài khoản"
            icon={<ArrowLeft size={20} color={colors.text} />}
            onPress={handleGoBack}
          />
        }
      />

      <Surface className="mb-4 p-5">
        <View className="mb-4 flex-row items-center">
          <KeyRound size={20} color={colors.primary} />
          <Text className="ml-2.5 text-base font-semibold text-ink">Đổi mật khẩu</Text>
        </View>

        <Text className="mb-2 text-xs font-semibold text-muted">MẬT KHẨU HIỆN TẠI</Text>
        <View className="mb-4 min-h-12 flex-row items-center rounded-2xl bg-surface-muted px-4">
          <Lock size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Mật khẩu hiện tại"
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            className="ml-3 flex-1 py-3 text-base text-ink"
          />
        </View>

        <Text className="mb-2 text-xs font-semibold text-muted">MẬT KHẨU MỚI</Text>
        <View className="mb-4 min-h-12 flex-row items-center rounded-2xl bg-surface-muted px-4">
          <Lock size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Tối thiểu 8 ký tự"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            className="ml-3 flex-1 py-3 text-base text-ink"
          />
        </View>

        <Text className="mb-2 text-xs font-semibold text-muted">XÁC NHẬN MẬT KHẨU MỚI</Text>
        <View className="mb-2 min-h-12 flex-row items-center rounded-2xl bg-surface-muted px-4">
          <Lock size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            className="ml-3 flex-1 py-3 text-base text-ink"
            onSubmitEditing={handleChangePassword}
          />
        </View>

        {error ? (
          <View
            accessibilityRole="alert"
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 16,
              backgroundColor: colors.dangerSoft,
              padding: 12,
              borderWidth: 1,
              borderColor: '#fca5a5',
            }}
          >
            <AlertCircle size={18} color={colors.danger} />
            <Text
              style={{
                marginLeft: 8,
                flex: 1,
                fontSize: 13,
                fontWeight: '500',
                color: colors.danger,
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {success ? (
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 16,
              backgroundColor: colors.successSoft,
              padding: 12,
              borderWidth: 1,
              borderColor: '#6ee7b7',
            }}
          >
            <CheckCircle2 size={18} color={colors.success} />
            <Text
              style={{
                marginLeft: 8,
                flex: 1,
                fontSize: 13,
                fontWeight: '500',
                color: colors.success,
              }}
            >
              {success}
            </Text>
          </View>
        ) : null}

        <View className="mt-5">
          <AppButton
            label="Cập nhật mật khẩu"
            variant="primary"
            loading={isSubmitting}
            onPress={handleChangePassword}
          />
        </View>
      </Surface>

      {/* App UI Alert Modal */}
      <AppAlertModal {...(alertState || { title: '' })} visible={Boolean(alertState?.visible)} />
    </Screen>
  );
}
