import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@utils/colors';

export default function RiderLayout() {
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
    </Stack>
  );
}
