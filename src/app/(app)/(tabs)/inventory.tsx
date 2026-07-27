import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { InventoryScreen } from '@/features/inventory/screens/inventory-screen';

export default function InventoryRoute() {
  return <ProtectedTab tab="inventory"><InventoryScreen /></ProtectedTab>;
}
