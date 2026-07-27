import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

interface ScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  withTabBar?: boolean;
  className?: string;
}

export function Screen({
  children,
  scroll = true,
  withTabBar = false,
  className,
  ...props
}: ScreenProps) {
  const contentClassName = clsx(
    'px-4 pt-3',
    withTabBar ? 'pb-28' : 'pb-8',
    className,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={contentClassName}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...props}
          >
            {children}
          </ScrollView>
        ) : (
          <View className={clsx('flex-1', contentClassName)}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
