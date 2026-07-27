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
  [WmsRole.ADMIN]: ['dashboard', 'products', 'inbound', 'putaway', 'scrap', 'outbound', 'inventory', 'profile'],
  [WmsRole.MANAGER]: ['dashboard', 'products', 'inbound', 'putaway', 'scrap', 'outbound', 'inventory', 'profile'],
  [WmsRole.RECEIVER]: ['inbound', 'putaway', 'scrap', 'products', 'profile'],
  [WmsRole.PICKER]: ['outbound', 'products', 'profile'],
  [WmsRole.PRINTER]: ['printing', 'products', 'profile'],
  [WmsRole.COUNTER]: ['inventory', 'products', 'scrap', 'profile'],
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
