import { WmsRole } from '@/shared/types/auth';
import {
  canAccessTab,
  getDefaultRouteForRole,
  getTabsForRole,
} from './role-navigation';

describe('role navigation', () => {
  it.each([
    [WmsRole.ADMIN, ['dashboard', 'products', 'inbound', 'outbound', 'profile']],
    [WmsRole.MANAGER, ['dashboard', 'products', 'inbound', 'outbound', 'profile']],
    [WmsRole.RECEIVER, ['inbound', 'products', 'profile']],
    [WmsRole.PICKER, ['outbound', 'products', 'profile']],
    [WmsRole.PRINTER, ['printing', 'products', 'profile']],
    [WmsRole.COUNTER, ['inventory', 'products', 'profile']],
    [WmsRole.SHIPPER, ['shipping', 'profile']],
  ])('returns the allowed tabs for %s', (role, expected) => {
    expect(getTabsForRole(role)).toEqual(expected);
  });

  it.each([
    [WmsRole.ADMIN, 'dashboard'],
    [WmsRole.MANAGER, 'dashboard'],
    [WmsRole.RECEIVER, 'inbound'],
    [WmsRole.PICKER, 'outbound'],
    [WmsRole.PRINTER, 'printing'],
    [WmsRole.COUNTER, 'inventory'],
    [WmsRole.SHIPPER, 'shipping'],
  ])('returns the first permitted route for %s', (role, expected) => {
    expect(getDefaultRouteForRole(role)).toBe(expected);
  });

  it('rejects tabs that are not assigned to the role', () => {
    expect(canAccessTab(WmsRole.SHIPPER, 'shipping')).toBe(true);
    expect(canAccessTab(WmsRole.SHIPPER, 'dashboard')).toBe(false);
  });
});
