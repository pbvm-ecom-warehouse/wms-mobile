import { WmsRole } from '@/shared/types/auth';

export type AppTab =
  | 'dashboard'
  | 'products'
  | 'inbound'
  | 'outbound'
  | 'printing'
  | 'inventory'
  | 'shipping'
  | 'scrap'
  | 'putaway'
  | 'profile';

const ROLE_TABS: Readonly<Record<WmsRole, readonly AppTab[]>> = {
  [WmsRole.ADMIN]: ['dashboard', 'inbound', 'outbound', 'products', 'profile'],
  [WmsRole.MANAGER]: ['dashboard', 'inbound', 'outbound', 'products', 'profile'],
  [WmsRole.RECEIVER]: ['dashboard', 'inbound', 'products', 'profile'],
  [WmsRole.PICKER]: ['outbound', 'products', 'profile'],
  [WmsRole.PRINTER]: ['printing', 'products', 'profile'],
  [WmsRole.COUNTER]: ['inventory', 'products', 'profile'],
  [WmsRole.SHIPPER]: ['shipping', 'profile'],
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
  ADMIN: ['dashboard', 'inbound', 'putaway', 'outbound', 'inventory', 'products', 'printing', 'shipping', 'scrap', 'profile'],
  MANAGER: ['dashboard', 'inbound', 'putaway', 'outbound', 'inventory', 'products', 'printing', 'shipping', 'scrap', 'profile'],
  RECEIVER: ['dashboard', 'inbound', 'putaway', 'scrap', 'products', 'profile'],
  PICKER: ['outbound', 'products', 'profile'],
  PRINTER: ['printing', 'products', 'profile'],
  COUNTER: ['inventory', 'products', 'scrap', 'profile'],
  SHIPPER: ['shipping', 'profile'],
};

export function canRoleAccessRoute(role?: string | WmsRole, routeKey?: string): boolean {
  if (!role || !routeKey) return true;
  const uppercaseRole = String(role).toUpperCase();
  const allowed = ROLE_ALLOWED_ROUTES[uppercaseRole];
  if (!allowed) return true;
  return allowed.includes(routeKey);
}
