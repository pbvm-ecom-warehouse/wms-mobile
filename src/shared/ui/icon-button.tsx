import React from 'react';
import { Pressable, View } from 'react-native';

interface IconButtonProps {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  notification?: boolean;
}

export function IconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
  notification = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full bg-white ${disabled ? 'opacity-50' : 'active:opacity-70'}`}
    >
      {icon}
      {notification ? (
        <View
          pointerEvents="none"
          className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-danger"
        />
      ) : null}
    </Pressable>
  );
}