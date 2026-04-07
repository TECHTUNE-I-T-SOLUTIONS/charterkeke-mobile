import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { AdVideoManager } from '@/components/AdVideoManager';
import { useIdleAdTracking } from '@/hooks/useIdleAdTracking';
import { COLORS } from '@utils/colors';

export default function DriverLayout() {
  const router = useRouter();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  
  // Track idle time and show ads periodically (time-based, not route-based)
  const { shouldShowAd, dismissAd } = useIdleAdTracking({
    enabled: true,
    excludeRoutes: [],
    currentRoute: 'home',
  });

  const handleAdCtaPress = () => {
    console.log('[DriverLayout] Navigating to available rides from ad');
    router.push('/driver/available-rides');
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="home" />
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
          <Stack.Screen name="help-and-support" />
        </Stack>

        {/* Bottom Navigation - Outside Stack to prevent re-renders */}
        <RiderBottomNavigation />
      </View>

      {/* Ad Video Manager - True full-screen overlay (one ad per session) */}
      {shouldShowAd && (
        <AdVideoManager
          visible={shouldShowAd}
          onClose={dismissAd}
          onNavigateToBooking={handleAdCtaPress}
        />
      )}
    </>
  );
}
