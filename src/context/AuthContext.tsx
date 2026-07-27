import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { User, WmsRole } from '../types';
import { Storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      setIsLoading(true);
      const savedUser = await Storage.getUser();
      const token = await Storage.getAccessToken();

      if (token) {
        try {
          const freshUser = await authApi.me();
          if (freshUser) {
            setUser(freshUser);
            await Storage.saveUser(freshUser);
          } else if (savedUser) {
            setUser(savedUser);
          }
        } catch (err: any) {
          if (err?.response?.status === 401) {
            await Storage.clearAll();
            setUser(null);
          } else if (savedUser) {
            setUser(savedUser);
          }
        }
      }
    } catch (e) {
      console.error('Error bootstrapping auth state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const freshUser = await authApi.me();
      if (freshUser) {
        setUser(freshUser);
        await Storage.saveUser(freshUser);
        return freshUser;
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await Storage.clearAll();
        setUser(null);
      }
    }
    return user;
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const tokens = await authApi.login(username, password);
      await Storage.saveTokens(tokens.accessToken, tokens.refreshToken);
      
      const userProfile = await authApi.me();
      setUser(userProfile);
      await Storage.saveUser(userProfile);
    } catch (err: any) {
      await Storage.clearAll();
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = await Storage.getRefreshToken();
      await authApi.logout(refreshToken || undefined);
    } catch {
      // ignore logout errors
    } finally {
      await Storage.clearAll();
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
