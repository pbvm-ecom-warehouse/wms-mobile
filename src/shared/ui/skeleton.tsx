import React, { useEffect, useState } from 'react';
import { Animated, ViewProps } from 'react-native';
import { clsx } from 'clsx';

export function Skeleton({ className, ...props }: ViewProps) {
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={clsx('rounded-2xl bg-border', className)}
      style={{ opacity }}
      {...props}
    />
  );
}
