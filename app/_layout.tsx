import { OtaUpdateNoticeModal } from '@/components/OtaUpdateNoticeModal';
import React, { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { AppState } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@context/AuthContext';
import { LocationProvider } from '@context/LocationContext';
import { RideProvider } from '@context/RideContext';
import { ThemeProvider } from '@context/ThemeContext';
import { AlertProvider } from '@context/AlertContext';
import { NotificationProvider } from '@context/NotificationContext';
import { configureNotifications, registerBackgroundNotificationTask } from '@services/notificationService';
import { AppErrorBoundary } from '@components/AppErrorBoundary';
import { GuidedTourProvider } from '@components/GuidedTour';
import Constants from 'expo-constants';
import { ExperienceConsentProvider } from '@/components/ExperienceConsentProvider';
import { flushExperienceQueue, recordExperience, reportAppError } from '@/services/experienceReporting';

// Check if running in Expo Go
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Inner component that renders the navigation
function RootLayoutContent() {
  const pathname = usePathname();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await configureNotifications();
        if (!IS_EXPO_GO) {
          await registerBackgroundNotificationTask();
        }
        console.log('✅ [App] Notifications initialized' + (IS_EXPO_GO ? ' (Expo Go - local only)' : ''));
      } catch (error) {
        console.error('❌ [App] Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    return () => {
      const screen = pathname.replace(/\/[0-9a-f-]{12,}/gi, '/[id]').slice(0, 80);
      void recordExperience('screen_view', screen, 'screen_duration', Date.now() - startedAt);
    };
  }, [pathname]);

  useEffect(() => {
    const errorUtils = (globalThis as any).ErrorUtils;
    if (!errorUtils?.getGlobalHandler || !errorUtils?.setGlobalHandler) return;
    const previousHandler = errorUtils.getGlobalHandler();
    const handler = (error: Error, isFatal?: boolean) => {
      void reportAppError(error, 'app', isFatal ? 'fatal_javascript_error' : 'unhandled_javascript_error');
      previousHandler?.(error, isFatal);
    };
    errorUtils.setGlobalHandler(handler);
    return () => {
      if (errorUtils.getGlobalHandler() === handler) errorUtils.setGlobalHandler(previousHandler);
    };
  }, []);

  useEffect(() => {
    void flushExperienceQueue();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flushExperienceQueue();
    });
    return () => subscription.remove();
  }, []);

    return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Index - handles routing based on auth state */}
        <Stack.Screen name="index" />
  
        {/* Splash screen */}
        <Stack.Screen name="splash" />
  
        {/* Auth stack */}
        <Stack.Screen name="auth" />
  
        {/* Rider stack */}
        <Stack.Screen name="rider" />
  
        {/* Driver stack */}
        <Stack.Screen name="driver" />
      </Stack>
    );
  }

// Outer component that wraps with providers
export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AlertProvider>
            <AuthProvider>
              <ExperienceConsentProvider>
                <LocationProvider>
                  <RideProvider>
                    <NotificationProvider>
                      <GuidedTourProvider>
                        <RootLayoutContent />
                        <OtaUpdateNoticeModal />
                      </GuidedTourProvider>
                    </NotificationProvider>
                  </RideProvider>
                </LocationProvider>
              </ExperienceConsentProvider>
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
