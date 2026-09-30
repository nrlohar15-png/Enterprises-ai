import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../../../shared/types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoUser: (role: 'admin' | 'manager' | 'employee') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = localStorage.getItem('enterprise_token');
    const storedUser = localStorage.getItem('enterprise_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify with backend
        const res = await api.getMe();
        setUser(res.user);
        localStorage.setItem('enterprise_user', JSON.stringify(res.user));
      } catch (err) {
        console.warn('Session verification failed, logging out');
        localStorage.removeItem('enterprise_token');
        localStorage.removeItem('enterprise_user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();

    const handleAuthChange = () => {
      initAuth();
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('enterprise_token', res.token);
    localStorage.setItem('enterprise_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('enterprise_token', res.token);
    localStorage.setItem('enterprise_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const switchDemoUser = async (role: 'admin' | 'manager' | 'employee') => {
    setLoading(true);
    let email = 'sarah.chen@apexglobal.com'; // admin
    if (role === 'manager') email = 'marcus.vance@apexglobal.com';
    if (role === 'employee') email = 'elena.rostova@apexglobal.com';

    try {
      await login(email, 'Password123!');
    } catch (e: any) {
      console.error('Demo login switch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      localStorage.setItem('enterprise_user', JSON.stringify(res.user));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
