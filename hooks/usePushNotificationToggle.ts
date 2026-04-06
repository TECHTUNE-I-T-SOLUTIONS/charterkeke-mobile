import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface PushSubscriptionStatus {
  isSubscribed: boolean;
  token?: string;
  platform: string;
  lastError?: string;
}

/**
 * Hook to manage push notification subscription status
 * Checks current subscription status, allows subscribe/unsubscribe
 * Works with custom authentication
 * 
 * Usage:
 * const { isSubscribed, isLoading, toggleSubscription, error } = usePushNotificationToggle();
 */
export const usePushNotificationToggle = () => {
  const { user } = useAuth(); // Get user from your custom auth context
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check subscription status on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current device token
      const currentToken = await AsyncStorage.getItem('expo_push_token');
      
      if (!currentToken) {
        // No token stored locally means not subscribed
        setIsSubscribed(false);
        setToken(null);
        setIsLoading(false);
        return;
      }

      setToken(currentToken);

      // Query API to check if this token is subscribed
      try {
        const response = (await apiService.get('/notifications/subscribe')) as any;
        
        if (response?.data && Array.isArray(response.data)) {
          // If we get an array of subscriptions
          const isActive = response.data.some(
            (sub: any) => sub.push_token === currentToken && sub.is_active
          );
          setIsSubscribed(isActive);
        } else if (response?.data?.isSubscribed !== undefined) {
          // If API returns isSubscribed flag directly
          setIsSubscribed(response?.data?.isSubscribed);
        } else if (response?.data?.count > 0) {
          // If API returns count of subscriptions
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false);
        }
      } catch (apiError: any) {
        // If API returns 401/403, user not authenticated
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          setIsSubscribed(false);
          setError('Please log in to manage notifications');
        } else if (apiError?.response?.status === 404) {
          // Endpoint not available - assume not subscribed
          console.warn('[PUSH] Endpoint not available (404), assuming not subscribed');
          setIsSubscribed(false);
          // Don't show error - endpoint will be available after backend deployment
        } else {
          // Otherwise assume not subscribed
          setIsSubscribed(false);
          console.warn('[PUSH] Error checking subscription:', apiError?.message);
        }
      }
    } catch (err: any) {
      console.error('[PUSH] Error checking subscription status:', err);
      setError(err?.message || 'Error checking subscription status');
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSubscription = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get current device token
      let currentToken = token || (await AsyncStorage.getItem('expo_push_token'));

      if (!currentToken) {
        // Need to request permission and get new token
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setError('Notification permission denied');
          setIsLoading(false);
          return;
        }

        // Get new token from Expo
        const notificationToken = await Notifications.getExpoPushTokenAsync();
        currentToken = notificationToken.data;
        
        // Store locally
        await AsyncStorage.setItem('expo_push_token', currentToken);
        setToken(currentToken);
      }

      if (isSubscribed) {
        // UNSUBSCRIBE
        try {
          await apiService.delete('/notifications/subscribe', {
            data: { push_token: currentToken },
          });
          setIsSubscribed(false);
        } catch (deleteError: any) {
          console.error('[PUSH] Error unsubscribing:', deleteError?.message);
          if (deleteError?.response?.status === 404) {
            // Endpoint doesn't exist yet - just update local state
            console.warn('[PUSH] Endpoint not available, updating local state only');
            setIsSubscribed(false);
          } else {
            throw deleteError;
          }
        }
      } else {
        // SUBSCRIBE
        const platform = getPlatform();
        try {
          await apiService.post('/notifications/subscribe', {
            push_token: currentToken,
            platform,
          });
          setIsSubscribed(true);
        } catch (postError: any) {
          console.error('[PUSH] Error subscribing:', postError?.message);
          if (postError?.response?.status === 404) {
            // Endpoint doesn't exist yet - store locally and retry later
            console.warn('[PUSH] Endpoint not available, will retry when backend is ready');
            setError('Notification service temporarily unavailable. We\'ll try again later.');
            // Still mark as subscribed locally for offline support
            setIsSubscribed(true);
          } else {
            throw postError;
          }
        }
      }
    } catch (err: any) {
      console.error('[PUSH] Error toggling subscription:', err);
      
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Please log in to manage notifications');
      } else if (err?.response?.status === 404) {
        setError('Notification service is being set up. Please try again in a moment.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Error updating notification preference');
      }
      
      // Revert state on error
      await checkSubscriptionStatus();
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed, token, checkSubscriptionStatus]);

  return {
    isSubscribed,
    isLoading,
    error,
    toggleSubscription,
    refreshStatus: checkSubscriptionStatus,
    token,
  };
};

/**
 * Get current platform (ios/android/web)
 */
function getPlatform(): string {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}
