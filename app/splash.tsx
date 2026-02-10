import React, { useEffect } from 'react';
import { View, Text, Image, Animated, Dimensions } from 'react-native';
import { COLORS } from '@/utils/colors';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

export default function SplashScreenComponent() {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.light.primary,
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Logo */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <Image
            source={require('@/assets/charter keke.png')}
            style={{
              width: 120,
              height: 120,
              resizeMode: 'contain',
            }}
          />
        </View>

        {/* App Title */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: '900',
            color: '#ffffff',
            marginTop: 20,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          Charter Keke
        </Text>

        {/* Tagline */}
        <Text
          style={{
            fontSize: 14,
            color: '#ffffff99',
            marginTop: 8,
            textAlign: 'center',
            letterSpacing: 0.3,
          }}
        >
          Ride Sharing Made Easy
        </Text>
      </Animated.View>

      {/* Loading indicator */}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#ffffff',
            marginHorizontal: 4,
            opacity: 0.6,
          }}
        />
        <Text
          style={{
            fontSize: 12,
            color: '#ffffff80',
            marginTop: 12,
          }}
        >
          Ready to ride...
        </Text>
      </View>
    </View>
  );
}
