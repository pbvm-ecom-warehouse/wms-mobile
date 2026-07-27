import React from 'react';
import { Text, View } from 'react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function AppHeader({ title, subtitle, leading, trailing }: AppHeaderProps) {
  return (
    <View className="mb-5 min-h-12 flex-row items-center">
      {leading ? <View className="mr-3">{leading}</View> : null}
      <View className="flex-1">
        <Text className="text-xl font-semibold tracking-[-0.4px] text-ink">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text> : null}
      </View>
      {trailing ? <View className="ml-3">{trailing}</View> : null}
    </View>
  );
}
