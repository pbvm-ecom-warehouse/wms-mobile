import React, { useEffect } from 'react';
import { useRouter, Slot, type Href } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { getDefaultRouteForRole } from '@/features/auth/model/role-navigation';
import { SessionLoading } from '@/features/auth/components/session-loading';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      router.replace(`/${defaultRoute}` as Href);
    }
  }, [isLoading, user, router]);

  if (isLoading || user) return <SessionLoading />;
  return <Slot />;
}
