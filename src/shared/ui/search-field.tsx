import React from 'react';
import { TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors } from '@/shared/theme/tokens';

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm',
}: SearchFieldProps) {
  return (
    <View className="min-h-12 flex-row items-center rounded-2xl bg-white px-4">
      <Search size={19} color={colors.textMuted} strokeWidth={1.8} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        className="ml-3 flex-1 py-3 text-sm text-ink"
        returnKeyType="search"
      />
    </View>
  );
}
