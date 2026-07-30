import React from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { ReceiverDailyDashboard } from '@/features/inbound/components/receiver-daily-dashboard';
import { CounterDailyDashboard } from '@/features/inventory/components/counter-daily-dashboard';
import { PrinterDailyDashboard } from '@/features/printing/components/printer-daily-dashboard';
import { ShipperDailyDashboard } from '@/features/shipping/components/shipper-daily-dashboard';
import { PickerDailyDashboard } from '@/features/outbound/components/picker-daily-dashboard';
import { ManagerDailyDashboard } from '../components/manager-daily-dashboard';
import { WmsRole } from '@/shared/types/auth';

export function DashboardScreen() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();

  if (role === WmsRole.RECEIVER) {
    return <ReceiverDailyDashboard />;
  }

  if (role === WmsRole.COUNTER) {
    return <CounterDailyDashboard />;
  }

  if (role === WmsRole.PRINTER) {
    return <PrinterDailyDashboard />;
  }

  if (role === WmsRole.SHIPPER) {
    return <ShipperDailyDashboard />;
  }

  if (role === WmsRole.PICKER) {
    return <PickerDailyDashboard />;
  }

  return <ManagerDailyDashboard />;
}
