import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@utils/colors';

export default function RiderLayout() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
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
  );
}
