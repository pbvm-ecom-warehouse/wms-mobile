import React from 'react';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { getDefaultRouteForRole } from '@/features/auth/model/role-navigation';
import { SessionLoading } from '@/features/auth/components/session-loading';

export default function IndexRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={`/${getDefaultRouteForRole(user.role)}` as Href} />;
}
