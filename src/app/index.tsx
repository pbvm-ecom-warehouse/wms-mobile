import React, { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { getDefaultRouteForRole } from '@/features/auth/model/role-navigation';
import { SessionLoading } from '@/features/auth/components/session-loading';

export default function IndexRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        const defaultRoute = getDefaultRouteForRole(user.role);
        router.replace(`/${defaultRoute}` as Href);
      }
    }
  }, [isLoading, user, router]);

  return <SessionLoading />;
}
