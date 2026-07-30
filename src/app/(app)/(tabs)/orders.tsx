import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { PurchaseOrdersScreen } from '@/features/orders/screens/purchase-orders-screen';

export default function OrdersRoute() {
  return (
    <ProtectedTab tab="orders">
      <PurchaseOrdersScreen />
    </ProtectedTab>
  );
}
