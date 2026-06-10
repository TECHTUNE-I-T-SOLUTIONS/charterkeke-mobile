import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
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
  useEffect(() => {
    // Initialize push notifications on app startup
    const initializeNotifications = async () => {
      try {
        await configureNotifications();
        await registerBackgroundNotificationTask();
        console.log('✅ [App] Notifications initialized');
      } catch (error) {
        console.error('❌ [App] Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
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
              <LocationProvider>
                <RideProvider>
                  <NotificationProvider>
                    <GuidedTourProvider>
                      <RootLayoutContent />
                    </GuidedTourProvider>
                  </NotificationProvider>
                </RideProvider>
              </LocationProvider>
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
