import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@services/auth';
import { syncService } from '@services/sync';
import { cacheService } from '@services/cache';
import { subscribeToPushNotifications, clearPushSubscription } from '@services/notificationService';
import { initializeWebSocket, disconnectWebSocket } from '@services/websocketService';
import { Rider, Driver, UserRole } from '@/types';

interface AuthContextType {
  user: Rider | Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  error: string | null;
  login: (email: string, password: string) => Promise<Rider | Driver>;
  signup: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Rider | Driver>) => Promise<{ success: boolean }>;
  verifyOTP: (payload: { email?: string; phone?: string; otp: string }) => Promise<{ success: boolean }>;
  resendOTP: (email: string) => Promise<{ success: boolean }>;
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
          // Ensure push subscription is active on app start
          try {
            const current = authService.getCurrentUser();
            if (current && current.id) {
              await subscribeToPushNotifications(current.id as string);
              console.log('🔔 [AUTH-CONTEXT] Push subscription ensured on app init');
            }
          } catch (err) {
            console.error('❌ [AUTH-CONTEXT] Failed to ensure push subscription on init:', err);
          }
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
      
      // Subscribe to push notifications on login
      try {
        await subscribeToPushNotifications(loggedInUser.id || '');
        console.log('🔔 [AUTH-CONTEXT] Push notification subscription successful');
      } catch (pushError) {
        console.error('❌ [AUTH-CONTEXT] Failed to subscribe to push notifications:', pushError);
        // Don't fail login if notifications fail
      }

      // Initialize WebSocket connection for real-time updates
      try {
        await initializeWebSocket(loggedInUser.id || '');
        console.log('🌐 [AUTH-CONTEXT] WebSocket initialized');
      } catch (wsError) {
        console.error('❌ [AUTH-CONTEXT] Failed to initialize WebSocket:', wsError);
        // Don't fail login if WebSocket fails
      }
      
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
      const signupResponse = await authService.signup(payload);
      const signedUpUser = (signupResponse as any)?.user || signupResponse;
      setUser(signedUpUser);
      const role = (signedUpUser as any)?.role;
      setUserRole(role);
      console.log('📍 [AUTH-CONTEXT] Signup - caching user role:', role);
      
      // Subscribe to push notifications on signup
      try {
        await subscribeToPushNotifications(signedUpUser.id || '');
        console.log('🔔 [AUTH-CONTEXT] Push notification subscription successful');
      } catch (pushError) {
        console.error('❌ [AUTH-CONTEXT] Failed to subscribe to push notifications:', pushError);
        // Don't fail signup if notifications fail
      }

      // Initialize WebSocket connection for real-time updates
      try {
        await initializeWebSocket(signedUpUser.id || '');
        console.log('🌐 [AUTH-CONTEXT] WebSocket initialized');
      } catch (wsError) {
        console.error('❌ [AUTH-CONTEXT] Failed to initialize WebSocket:', wsError);
        // Don't fail signup if WebSocket fails
      }
      
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
      
      // Disconnect WebSocket
      try {
        disconnectWebSocket();
        console.log('🌐 [AUTH-CONTEXT] WebSocket disconnected');
      } catch (wsError) {
        console.error('❌ [AUTH-CONTEXT] Failed to disconnect WebSocket:', wsError);
        // Don't fail logout if WebSocket fails
      }
      
      // Clear push notifications subscription on logout
      try {
        await clearPushSubscription();
        console.log('🔔 [AUTH-CONTEXT] Push notification subscription cleared');
      } catch (pushError) {
        console.error('❌ [AUTH-CONTEXT] Failed to clear push notifications:', pushError);
        // Don't fail logout if notifications fail
      }
      
      // Clear session resumed flag
      await AsyncStorage.removeItem('sessionResumed');
      
      // Call logout API - this won't throw even if it fails
      await authService.logout();
      setUser(null);
      setUserRole(null);
      console.log('🔓 [AUTH-CONTEXT] Logout successful - user cleared');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Logout failed';
      console.error('❌ [AUTH-CONTEXT] Logout error:', errorMessage);
      setError(errorMessage);
      // Still clear local user state even if logout API fails
      setUser(null);
      setUserRole(null);
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

  const handleUpdateUserProfile = async (updates: Partial<Rider | Driver>): Promise<{ success: boolean }> => {
    try {
      setError(null);
      await authService.updateCurrentUser(updates);
      setUser(authService.getCurrentUser());
      return { success: true };
    } catch (err) {
      const errorMessage = (err as Error).message || 'Update failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleVerifyOTP = async (payload: { email?: string; phone?: string; otp: string }): Promise<{ success: boolean }> => {
    try {
      setError(null);
      await authService.verifyOTP(payload.phone || payload.email || '', payload.otp);
      return { success: true };
    } catch (err) {
      const errorMessage = (err as Error).message || 'OTP verification failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleResendOTP = async (email: string): Promise<{ success: boolean }> => {
    try {
      setError(null);
      await authService.requestPasswordReset(email);
      return { success: true };
    } catch (err) {
      const errorMessage = (err as Error).message || 'Resend OTP failed';
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
    userRole: userRole || (authService.getUserRole() as UserRole | null),
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    updateUserProfile: handleUpdateUserProfile,
    verifyOTP: handleVerifyOTP,
    resendOTP: handleResendOTP,
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
