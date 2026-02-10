import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@utils/colors';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: COLORS.light.background,
        },
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 0 } },
          close: { animation: 'timing', config: { duration: 0 } },
        },
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
    </Stack>
  );
}
