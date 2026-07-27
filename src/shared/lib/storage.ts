import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User } from '@/shared/types/auth';

const KEYS = {
  ACCESS_TOKEN: 'wms_access_token',
  REFRESH_TOKEN: 'wms_refresh_token',
  USER_INFO: 'wms_user_info',
} as const;

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

export const Storage = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await setItem(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) await setItem(KEYS.REFRESH_TOKEN, refreshToken);
  },
  getAccessToken: () => getItem(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => getItem(KEYS.REFRESH_TOKEN),
  async saveUser(user: User): Promise<void> {
    await setItem(KEYS.USER_INFO, JSON.stringify(user));
  },
  async getUser(): Promise<User | null> {
    const value = await getItem(KEYS.USER_INFO);
    if (!value) return null;
    try {
      return JSON.parse(value) as User;
    } catch {
      return null;
    }
  },
  async clearAll(): Promise<void> {
    await Promise.all([
      removeItem(KEYS.ACCESS_TOKEN),
      removeItem(KEYS.REFRESH_TOKEN),
      removeItem(KEYS.USER_INFO),
    ]);
  },
};
