import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { DashboardScreen } from '@/features/dashboard/screens/dashboard-screen';

export default function DashboardRoute() {
  return <ProtectedTab tab="dashboard"><DashboardScreen /></ProtectedTab>;
}
