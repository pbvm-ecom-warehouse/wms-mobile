import React from 'react';
import { Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';
import { AppButton } from './app-button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center rounded-3xl bg-white px-6 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
        <Inbox size={26} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text className="text-center text-base font-semibold text-ink">{title}</Text>
      <Text className="mt-1.5 text-center text-sm leading-5 text-muted">{description}</Text>
      {actionLabel && onAction ? (
        <View className="mt-5 min-w-32">
          <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
