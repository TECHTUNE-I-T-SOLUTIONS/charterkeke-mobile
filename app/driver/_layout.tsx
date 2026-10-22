import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@utils/colors';

export default function DriverLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { mode } = useTheme();
  const { user, userRole, isLoading } = useAuth();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  // Role-based access control
  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!user || !userRole) {
      router.replace('/(auth)/login');
      return;
    }

    // If user is not a driver, redirect to rider side
    if (userRole !== 'driver') {
      console.log(`[DriverLayout] User role ${userRole} not allowed. Redirecting to rider side.`);
      router.replace('/rider/booking');
    }
  }, [user, userRole, isLoading, router]);

  // Don't render if loading or role doesn't match
  if (isLoading) return null;
  if (!user || !userRole) return null;
  if (userRole !== 'driver') return null;

  // Hide bottom nav on screens where it would cover content
  const hideBottomNav = [
    'awaiting-verification',
    'help-and-support',
  ].some((route) => segments[segments.length - 1] === route);

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="home" />
          <Stack.Screen name="awaiting-verification" />
          <Stack.Screen name="rides" />
          <Stack.Screen name="ride-details" />
          <Stack.Screen name="available-rides" />
          <Stack.Screen name="active-ride" />
          <Stack.Screen name="earnings" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="documents" />
          <Stack.Screen name="document-viewer" />
          <Stack.Screen name="bank-accounts" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="vehicle" />
          <Stack.Screen name="privacy-settings" />
          <Stack.Screen name="help-and-support" />
          <Stack.Screen name="faq" />
        </Stack>

        {/* Bottom Navigation - Outside Stack to prevent re-renders */}
        {!hideBottomNav && <RiderBottomNavigation />}
      </View>
    </>
  );
}
