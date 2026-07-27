import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '@/shared/theme/tokens';

export function SessionLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-3 text-sm text-muted">Đang khởi tạo phiên...</Text>
    </View>
  );
}
