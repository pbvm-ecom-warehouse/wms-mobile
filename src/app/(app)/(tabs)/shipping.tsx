import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { ShippingScreen } from '@/features/shipping/screens/shipping-screen';

export default function ShippingRoute() {
  return <ProtectedTab tab="shipping"><ShippingScreen /></ProtectedTab>;
}
