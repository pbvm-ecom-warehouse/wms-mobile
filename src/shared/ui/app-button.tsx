import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { clsx } from 'clsx';
import { colors } from '@/shared/theme/tokens';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={clsx(
        'min-h-12 flex-row items-center justify-center rounded-2xl px-5',
        variant === 'primary' && 'bg-primary',
        variant === 'secondary' && 'border border-border bg-white',
        variant === 'danger' && 'bg-danger',
        isDisabled && 'opacity-50',
      )}
    >
      {loading ? <ActivityIndicator color={colors.surface} className="mr-2" /> : null}
      <Text
        className={clsx(
          'text-sm font-semibold',
          variant === 'secondary' ? 'text-ink' : 'text-white',
        )}
      >
        {loading ? 'Đang xử lý...' : label}
      </Text>
    </Pressable>
  );
}
