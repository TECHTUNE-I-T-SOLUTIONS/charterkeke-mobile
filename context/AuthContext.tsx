import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@services/auth';
import { syncService } from '@services/sync';
import { cacheService } from '@services/cache';
import { Rider, Driver, UserRole } from '@types/index';

interface AuthContextType {
  user: Rider | Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  error: string | null;
  login: (email: string, password: string) => Promise<Rider | Driver>;
  signup: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Rider | Driver>) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  clearCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Rider | Driver | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth on app launch
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        await authService.initialize();

        if (authService.isAuthenticated()) {
          setUser(authService.getCurrentUser());
          // Start sync service
          syncService.startAutoSync();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      syncService.stopAutoSync();
    };
  }, []);

  const handleLogin = async (email: string, password: string): Promise<Rider | Driver> => {
    try {
      setError(null);
      setIsLoading(true);
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      const role = (loggedInUser as any)?.role;
      setUserRole(role);
      console.log('📍 [AUTH-CONTEXT] Login - caching user role:', role);
      syncService.startAutoSync();
      return loggedInUser;
    } catch (err) {
      const errorMessage = (err as Error).message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (payload: any) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.signup(payload);
      setUser(response.user);
      syncService.startAutoSync();
    } catch (err) {
      const errorMessage = (err as Error).message || 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      syncService.stopAutoSync();
      await authService.logout();
      setUser(null);
      setUserRole(null);
      console.log('🔓 [AUTH-CONTEXT] Logout - cleared user role cache');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Logout failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleClearCache = async () => {
    try {
      setUser(null);
      setUserRole(null);
      await cacheService.clearUser();
      console.log('🗑️  [AUTH-CONTEXT] Cache cleared');
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const handleUpdateUserProfile = async (updates: Partial<Rider | Driver>) => {
    try {
      setError(null);
      await authService.updateCurrentUser(updates);
      setUser(authService.getCurrentUser());
    } catch (err) {
      const errorMessage = (err as Error).message || 'Update failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleVerifyOTP = async (phone: string, otp: string) => {
    try {
      setError(null);
      await authService.verifyOTP(phone, otp);
    } catch (err) {
      const errorMessage = (err as Error).message || 'OTP verification failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setError(null);
      await authService.requestPasswordReset(email);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Password reset failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: authService.isAuthenticated(),
    isLoading,
    userRole: userRole || authService.getUserRole(),
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    updateUserProfile: handleUpdateUserProfile,
    verifyOTP: handleVerifyOTP,
    resetPassword: handleResetPassword,
    clearError: handleClearError,
    clearCache: handleClearCache,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used withinAuthProvider');
  }
  return context;
};
