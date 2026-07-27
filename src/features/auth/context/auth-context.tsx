import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/features/auth/api/auth-api';
import { bootstrapSession } from '@/features/auth/model/bootstrap-session';
import { Storage } from '@/shared/lib/storage';
import type { User } from '@/shared/types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    bootstrapSession({
      getAccessToken: Storage.getAccessToken,
      getUser: Storage.getUser,
      saveUser: Storage.saveUser,
      fetchCurrentUser: authApi.me,
    })
      .then((sessionUser) => {
        if (active) setUser(sessionUser);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function login(username: string, password: string) {
    setIsLoading(true);
    try {
      const tokens = await authApi.login(username, password);
      await Storage.saveTokens(tokens.accessToken, tokens.refreshToken);
      const profile = await authApi.me();
      await Storage.saveUser(profile);
      setUser(profile);
    } catch (error) {
      await Storage.clearAll();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await authApi.logout((await Storage.getRefreshToken()) || undefined);
    } finally {
      await Storage.clearAll();
      setUser(null);
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
