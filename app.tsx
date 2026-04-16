import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Slot } from 'expo-router';
import { UpdateService } from '@/services/updateService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    // Custom fonts are optional - using system fonts as fallback
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      
      // Initialize version detection on app startup
      // This checks for app updates and caches the version
      UpdateService.initializeVersionDetection().catch(error => {
        console.error('[App] Version initialization error (non-blocking):', error);
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Slot />
      <StatusBar animated translucent={false} />
    </>
  );
}
