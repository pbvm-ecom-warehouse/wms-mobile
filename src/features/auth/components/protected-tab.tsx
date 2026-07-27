import React from 'react';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  canAccessTab,
  getDefaultRouteForRole,
  type AppTab,
} from '@/features/auth/model/role-navigation';
import { SessionLoading } from './session-loading';

export function ProtectedTab({
  tab,
  children,
}: {
  tab: AppTab;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SessionLoading />;
  if (!user) return <Redirect href="/login" />;
  if (!canAccessTab(user.role, tab)) {
    return <Redirect href={`/${getDefaultRouteForRole(user.role)}` as Href} />;
  }
  return children;
}
