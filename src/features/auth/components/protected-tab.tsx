import React, { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
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
  const router = useRouter();

  const isAllowed = user ? canAccessTab(user.role, tab) : false;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!isAllowed) {
        const defaultRoute = getDefaultRouteForRole(user.role);
        router.replace(`/${defaultRoute}` as Href);
      }
    }
  }, [isLoading, user, isAllowed, router]);

  if (isLoading) return <SessionLoading />;
  if (!user || !isAllowed) return <SessionLoading />;

  return <>{children}</>;
}
