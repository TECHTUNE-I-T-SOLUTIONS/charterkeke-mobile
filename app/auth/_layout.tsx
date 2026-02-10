import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@utils/colors';

export default function AuthLayout() {
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
      <Stack.Screen name="welcome" />
      <Stack.Screen name="choice" />
      <Stack.Screen name="login-new" options={{ title: 'Sign In' }} />
      <Stack.Screen name="signup-new" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="profile-completion" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
