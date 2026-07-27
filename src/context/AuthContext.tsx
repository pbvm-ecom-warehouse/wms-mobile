import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { User, WmsRole } from '../types';
import { Storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchMockRole: (role: WmsRole) => Promise<void>;
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
        } catch {
          if (savedUser) {
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

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // 100% Direct Live Deployed API Connection (No mock fallback)
      const tokens = await authApi.login(username, password);
      await Storage.saveTokens(tokens.accessToken, tokens.refreshToken);
      
      const userProfile = await authApi.me();
      setUser(userProfile);
      await Storage.saveUser(userProfile);
    } catch (err: any) {
      // Clear any previous token or stale session on login failure
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

  const switchMockRole = async (newRole: WmsRole) => {
    if (!user) return;
    const updatedUser: User = { ...user, role: newRole };
    setUser(updatedUser);
    await Storage.saveUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchMockRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
