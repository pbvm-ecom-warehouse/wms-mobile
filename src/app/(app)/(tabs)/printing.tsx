import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { PrintingScreen } from '@/features/printing/screens/printing-screen';

export default function PrintingRoute() {
  return <ProtectedTab tab="printing"><PrintingScreen /></ProtectedTab>;
}
