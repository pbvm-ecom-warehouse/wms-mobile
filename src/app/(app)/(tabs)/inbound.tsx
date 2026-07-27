import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { InboundScreen } from '@/features/inbound/screens/inbound-screen';

export default function InboundRoute() {
  return <ProtectedTab tab="inbound"><InboundScreen /></ProtectedTab>;
}
