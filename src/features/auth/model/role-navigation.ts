import { WmsRole } from '@/shared/types/auth';

export type AppTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'inbound'
  | 'outbound'
  | 'printing'
  | 'inventory'
  | 'shipping'
  | 'scrap'
  | 'putaway'
  | 'profile';

const ROLE_TABS: Readonly<Record<WmsRole, readonly AppTab[]>> = {
  [WmsRole.ADMIN]: ['dashboard', 'orders', 'inbound', 'outbound', 'profile'],
  [WmsRole.MANAGER]: ['dashboard', 'orders', 'inbound', 'outbound', 'profile'],
  [WmsRole.RECEIVER]: ['dashboard', 'inbound', 'putaway', 'profile'],
  [WmsRole.PICKER]: ['dashboard', 'outbound', 'profile'],
  [WmsRole.PRINTER]: ['dashboard', 'printing', 'profile'],
  [WmsRole.COUNTER]: ['dashboard', 'inventory', 'profile'],
  [WmsRole.SHIPPER]: ['dashboard', 'shipping', 'profile'],
};

export function getTabsForRole(role: WmsRole): readonly AppTab[] {
  return ROLE_TABS[role];
}

export function getDefaultRouteForRole(role: WmsRole): AppTab {
  return ROLE_TABS[role][0];
}

export function canAccessTab(role: WmsRole, tab: AppTab): boolean {
  return ROLE_TABS[role].includes(tab);
}

const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  ADMIN: ['dashboard', 'orders', 'inbound', 'putaway', 'outbound', 'inventory', 'products', 'printing', 'shipping', 'scrap', 'profile'],
  MANAGER: ['dashboard', 'orders', 'inbound', 'putaway', 'outbound', 'inventory', 'products', 'printing', 'shipping', 'scrap', 'profile'],
  RECEIVER: ['dashboard', 'inbound', 'putaway', 'scrap', 'products', 'profile'],
  PICKER: ['dashboard', 'outbound', 'products', 'profile'],
  PRINTER: ['dashboard', 'printing', 'products', 'profile'],
  COUNTER: ['dashboard', 'inventory', 'products', 'scrap', 'profile'],
  SHIPPER: ['dashboard', 'shipping', 'products', 'profile'],
};

export function canRoleAccessRoute(role?: string | WmsRole, routeKey?: string): boolean {
  if (!role || !routeKey) return true;
  const uppercaseRole = String(role).toUpperCase();
  const allowed = ROLE_ALLOWED_ROUTES[uppercaseRole];
  if (!allowed) return true;
  return allowed.includes(routeKey);
}
