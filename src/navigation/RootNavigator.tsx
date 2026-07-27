import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { WmsRole } from '../types';

import {
  AdminNavigator,
  CounterNavigator,
  PickerNavigator,
  PrinterNavigator,
  ReceiverNavigator,
  ShipperNavigator,
} from './RoleNavigators';

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen />
      ) : (
        <>
          {(user.role === WmsRole.ADMIN || user.role === WmsRole.MANAGER) && <AdminNavigator />}
          {user.role === WmsRole.RECEIVER && <ReceiverNavigator />}
          {user.role === WmsRole.PICKER && <PickerNavigator />}
          {user.role === WmsRole.PRINTER && <PrinterNavigator />}
          {user.role === WmsRole.COUNTER && <CounterNavigator />}
          {user.role === WmsRole.SHIPPER && <ShipperNavigator />}
        </>
      )}
    </NavigationContainer>
  );
};
