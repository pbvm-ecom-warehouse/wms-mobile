import React, { useEffect } from 'react';
import { useRouter, Slot } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { SessionLoading } from '@/features/auth/components/session-loading';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return <SessionLoading />;
  return <Slot />;
}
