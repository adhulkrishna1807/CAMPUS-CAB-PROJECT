'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, RiderInfo } from '@/types';
import { api } from '@/services/api';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AuthContextType {
  user: User | null;
  riderInfo: RiderInfo | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  demoLogin: (role: UserRole) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [riderInfo, setRiderInfo] = useState<RiderInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('campuscab_token');
    if (!savedToken) {
      setUser(null);
      setRiderInfo(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(savedToken);
      const data = await api.getMe();
      setUser(data.user);
      setRiderInfo(data.rider);
    } catch (err) {
      console.error('Session expired or invalid token', err);
      localStorage.removeItem('campuscab_token');
      setUser(null);
      setRiderInfo(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleAuthSuccess = (accessToken: string, authUser: User) => {
    localStorage.setItem('campuscab_token', accessToken);
    setToken(accessToken);
    setUser(authUser);
    addToast(`Signed in successfully as ${authUser.name}`, 'success');

    if (authUser.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (authUser.role === 'RIDER') {
      router.push('/rider/dashboard');
    } else {
      router.push('/user/dashboard');
    }
  };

  const login = async (email: string, pass: string): Promise<User> => {
    try {
      const data = await api.login(email, pass);
      handleAuthSuccess(data.access_token, data.user);
      return data.user;
    } catch (err: any) {
      addToast(err.message || 'Login failed. Please check your credentials.', 'error');
      throw err;
    }
  };

  const register = async (formData: any): Promise<User> => {
    try {
      const data = await api.register(formData);
      handleAuthSuccess(data.access_token, data.user);
      return data.user;
    } catch (err: any) {
      addToast(err.message || 'Registration failed.', 'error');
      throw err;
    }
  };

  const demoLogin = async (targetRole: UserRole): Promise<User> => {
    try {
      const data = await api.demoLogin(targetRole);
      handleAuthSuccess(data.access_token, data.user);
      return data.user;
    } catch (err: any) {
      addToast(err.message || 'Demo login failed.', 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('campuscab_token');
    setUser(null);
    setRiderInfo(null);
    setToken(null);
    addToast('You have been logged out.', 'info');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        riderInfo,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
