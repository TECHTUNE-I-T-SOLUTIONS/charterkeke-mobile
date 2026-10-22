import React, { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@utils/colors';

export default function RiderLayout() {
  const router = useRouter();
  const pathname = usePathname();
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

    // If user is not a rider, redirect to driver side
    if (userRole !== 'rider') {
      console.log(`[RiderLayout] User role ${userRole} not allowed. Redirecting to driver side.`);
      router.replace('/driver/dashboard');
    }
  }, [user, userRole, isLoading, router]);

  // Don't render if loading or role doesn't match
  if (isLoading) return null;
  if (!user || !userRole) return null;
  if (userRole !== 'rider') return null;

  // Hide bottom nav on screens where it would cover content
  const hideBottomNav = [
    '/rider/help-and-support',
    '/rider/active-ride',
    '/rider/chat',
  ].some((route) => pathname.startsWith(route));

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Home screen commented out for simplified rider experience */}
          {/* <Stack.Screen name="home" /> */}
          <Stack.Screen name="booking" />
          <Stack.Screen name="active-ride" />
          <Stack.Screen name="ride-details" />
          <Stack.Screen name="rides-history" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="emergency-contacts" />
          <Stack.Screen name="payment-methods" />
          <Stack.Screen name="rating" />
          <Stack.Screen name="privacy-settings" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="about" />
          <Stack.Screen name="help-and-support" />
          <Stack.Screen name="notifications" />
          {/* Replaced referrals with cashback */}
          <Stack.Screen name="cashback" />
        </Stack>

        {/* Bottom Navigation — hidden on screens where it covers keyboard/input */}
        {!hideBottomNav && <RiderBottomNavigation />}
      </View>
    </>
  );
}
