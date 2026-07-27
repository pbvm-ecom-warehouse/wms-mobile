import React from 'react';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { getDefaultRouteForRole } from '@/features/auth/model/role-navigation';

export default function TabsIndex() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={`/${getDefaultRouteForRole(user.role)}` as Href} />;
}
