import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

interface SurfaceProps extends ViewProps {
  padded?: boolean;
}

export function Surface({ padded = true, className, ...props }: SurfaceProps) {
  return (
    <View
      className={clsx('rounded-3xl bg-white', padded && 'p-4', className)}
      {...props}
    />
  );
}
