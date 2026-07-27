import React from 'react';
import { Text, View } from 'react-native';
import { clsx } from 'clsx';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  return (
    <View
      className={clsx(
        'self-start rounded-full px-2.5 py-1',
        variant === 'success' && 'bg-success-soft',
        variant === 'warning' && 'bg-warning-soft',
        variant === 'danger' && 'bg-danger-soft',
        variant === 'neutral' && 'bg-surface-muted',
      )}
    >
      <Text
        className={clsx(
          'text-[11px] font-semibold',
          variant === 'success' && 'text-success',
          variant === 'warning' && 'text-warning',
          variant === 'danger' && 'text-danger',
          variant === 'neutral' && 'text-muted',
        )}
      >
        {label}
      </Text>
    </View>
  );
}
