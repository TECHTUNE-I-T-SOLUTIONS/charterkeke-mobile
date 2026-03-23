import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const LAST_AD_SHOWN_KEY = 'lastAdShownTime';
const AD_DISMISSED_KEY = 'adDismissedTime';

interface UseIdleAdTrackingOptions {
  enabled?: boolean;
  excludeRoutes?: string[];
  currentRoute?: string;
}

export function useIdleAdTracking(options: UseIdleAdTrackingOptions = {}) {
  const {
    enabled = true,
    excludeRoutes = ['booking', 'payment', 'confirm-ride', 'ride-details'],
    currentRoute = '',
  } = options;

  const [shouldShowAd, setShouldShowAd] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const foregroundTimeRef = useRef(Date.now());

  // Check if we should exclude showing ads on current route
  const isExcludedRoute = useCallback(() => {
    return excludeRoutes.some(route => 
      currentRoute.toLowerCase().includes(route.toLowerCase())
    );
  }, [currentRoute, excludeRoutes]);

  // Check if enough time has passed since last ad
  const canShowAd = useCallback(async () => {
    if (isExcludedRoute()) return false;

    try {
      const lastShownStr = await AsyncStorage.getItem(LAST_AD_SHOWN_KEY);
      const lastShown = lastShownStr ? parseInt(lastShownStr, 10) : 0;
      const now = Date.now();

      return now - lastShown >= AD_INTERVAL_MS;
    } catch (error) {
      console.error('[useIdleAdTracking] Error checking last ad shown:', error);
      return true; // Show ad if we can't check
    }
  }, [isExcludedRoute]);

  // Record that an ad was shown
  const recordAdShown = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_AD_SHOWN_KEY, Date.now().toString());
    } catch (error) {
      console.error('[useIdleAdTracking] Error recording ad shown:', error);
    }
  }, []);

  // Handle app state changes
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground
        const backgroundDuration = Date.now() - foregroundTimeRef.current;
        
        // If user was in background for more than the interval, show ad
        if (backgroundDuration >= AD_INTERVAL_MS) {
          const shouldShow = await canShowAd();
          if (shouldShow && enabled) {
            setShouldShowAd(true);
            await recordAdShown();
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background
        foregroundTimeRef.current = Date.now();
      }

      appStateRef.current = nextAppState;
    },
    [canShowAd, recordAdShown, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Check on initial mount if enough time has passed
    const checkInitial = async () => {
      const shouldShow = await canShowAd();
      if (shouldShow) {
        setShouldShowAd(true);
        await recordAdShown();
      }
    };

    checkInitial();

    return () => {
      subscription.remove();
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [enabled, canShowAd, recordAdShown, handleAppStateChange]);

  const dismissAd = useCallback(() => {
    setShouldShowAd(false);
  }, []);

  return {
    shouldShowAd,
    dismissAd,
  };
}
