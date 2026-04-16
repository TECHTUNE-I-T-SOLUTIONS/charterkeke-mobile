import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@utils/colors';

export default function DriverLayout() {
  const router = useRouter();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

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
    </>
  );
}
