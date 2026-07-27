import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { OutboundScreen } from '@/features/outbound/screens/outbound-screen';

export default function OutboundRoute() {
  return <ProtectedTab tab="outbound"><OutboundScreen /></ProtectedTab>;
}
