import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types';

const KEYS = {
  ACCESS_TOKEN: 'wms_access_token',
  REFRESH_TOKEN: 'wms_refresh_token',
  USER_INFO: 'wms_user_info',
};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  } else {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  }
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  }
}

export const Storage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await setItem(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await setItem(KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  async getAccessToken(): Promise<string | null> {
    return getItem(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(KEYS.REFRESH_TOKEN);
  },

  async saveUser(user: User): Promise<void> {
    await setItem(KEYS.USER_INFO, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const raw = await getItem(KEYS.USER_INFO);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await removeItem(KEYS.ACCESS_TOKEN);
    await removeItem(KEYS.REFRESH_TOKEN);
    await removeItem(KEYS.USER_INFO);
  },
};
