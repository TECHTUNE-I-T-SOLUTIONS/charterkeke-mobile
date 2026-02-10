import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@utils/colors';
import { AuthProvider } from '@context/AuthContext';
import { LocationProvider } from '@context/LocationContext';
import { RideProvider } from '@context/RideContext';
import { ThemeProvider } from '@context/ThemeContext';

// Inner component that renders the navigation
function RootLayoutContent() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        cardStyle: {
          backgroundColor: COLORS.light.background,
        },
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 0 } },
          close: { animation: 'timing', config: { duration: 0 } },
        },
      }}
    >
      {/* Index - handles routing based on auth state */}
      <Stack.Screen name="index" options={{ transitionSpec: { open: { animation: 'timing', config: { duration: 0 } }, close: { animation: 'timing', config: { duration: 0 } } } }} />

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
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <RideProvider>
            <RootLayoutContent />
          </RideProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}