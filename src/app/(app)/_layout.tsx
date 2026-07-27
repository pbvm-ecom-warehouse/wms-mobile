import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-context';
import { SessionLoading } from '@/features/auth/components/session-loading';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!user) return <Redirect href="/login" />;
  return <Slot />;
}
