import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { ProductsScreen } from '@/features/products/screens/products-screen';

export default function ProductsRoute() {
  return <ProtectedTab tab="products"><ProductsScreen /></ProtectedTab>;
}
