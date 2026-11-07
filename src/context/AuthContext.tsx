import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ApiClient } from '../lib/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (mobile: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (shopName: string, mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp?: (phone: string, name?: string) => Promise<{ success: boolean; message: string; resendCooldown?: number; error?: string }>;
  verifyOtp?: (phone: string, otp: string, name?: string, password?: string) => Promise<{ success: boolean; message: string; user?: UserProfile; error?: string }>;
  logout: () => void;
  updateProfile: (shopName: string, phone?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local stored session for user account
    const stored = ApiClient.getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const register = async (shopName: string, mobile: string, password: string) => {
    const res = await ApiClient.register(shopName, mobile, password);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const login = async (mobile: string, password?: string) => {
    const res = await ApiClient.login(mobile, password);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    ApiClient.logout();
    setUser(null);
  };

  const updateProfile = (shopName: string, phone?: string) => {
    if (!user) return;
    const updated: UserProfile = { ...user, shopName, name: shopName, phone: phone || user.phone };
    setUser(updated);
    localStorage.setItem('radhamadhab_auth_v2', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
