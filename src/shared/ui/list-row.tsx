import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';

interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onPress?: () => void;
}

export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  badge,
  onPress,
}: ListRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="min-h-16 flex-row items-center border-b border-border py-3 last:border-b-0 active:opacity-70"
    >
      {icon ? (
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
          {icon}
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="ml-3 items-end">
        {meta ? <Text className="text-xs font-semibold text-ink">{meta}</Text> : null}
        {badge ? <View className="mt-1">{badge}</View> : null}
      </View>
      {onPress ? <ChevronRight size={17} color={colors.textMuted} className="ml-2" /> : null}
    </Pressable>
  );
}
