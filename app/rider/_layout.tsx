import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { AdVideoManager } from '@/components/AdVideoManager';
import { useIdleAdTracking } from '@/hooks/useIdleAdTracking';
import { COLORS } from '@utils/colors';

export default function RiderLayout() {
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
    console.log('[RiderLayout] Navigating to booking screen from ad');
    router.push('/rider/booking');
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
