// 'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { BRAND } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function AuthChoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [userName, setUserName] = useState<string>('');
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const logoFloat = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const videoRef = useRef<Video>(null);

  // Load user name and animations
  useEffect(() => {
    // Fade and slide animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Load user name
    const loadUserName = async () => {
      try {
        const stored = await AsyncStorage.getItem('userProfile');
        if (stored) {
          const profile = JSON.parse(stored);
          setUserName(profile.firstName || profile.name || '');
        }
      } catch (error) {
        console.log('Error loading user profile:', error);
      }
    };
    loadUserName();
  }, []);

  // All animations
  useEffect(() => {
    // Logo floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb 1 animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb1Y, {
            toValue: -16,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb1Scale, {
            toValue: 1.15,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(orb1Scale, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Orb 2 animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb2Y, {
            toValue: 18,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(orb2Y, {
            toValue: 0,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb2Scale, {
            toValue: 0.9,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(orb2Scale, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSignup = () => router.push('/auth/signup-new');
  const handleLogin = () => router.push('/auth/login-new');

  const isLight = theme.mode === 'light';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <ThemeToggle top={insets.top + 16} right={20} />

      {/* Video Background */}
      <Video
        ref={videoRef}
        source={require('@assets/welcome-bg.mp4')}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        onError={(error) => {
          console.log('🔴 Video error:', error);
        }}
        onLoad={() => {
          console.log('🟢 Video loaded successfully');
        }}
      />

      {/* Dark Overlay - more dimmed for better readability */}
      <View style={[styles.videoOverlay]} />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        
        {/* Brand Area */}
        <Animated.View style={[styles.brandArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Image
            source={require('@assets/charter keke.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {userName ? `Welcome,\n${userName}!` : "Let's Get\nStarted"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {userName 
              ? 'Ready for your next ride?' 
              : 'Join the community of riders and drivers moving effortlessly through the city.'}
          </Text>
        </Animated.View>

        {/* Action Area */}
        <Animated.View style={[styles.actionArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Sign Up Button (Primary) */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={handleSignup}
          >
            <LinearGradient
              colors={[BRAND.primary, '#E68200']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <View>
                <Text style={styles.primaryBtnTitle}>Create Account</Text>
                <Text style={styles.primaryBtnSubtitle}>New to Charter Keke?</Text>
              </View>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="arrow-right" size={20} color={BRAND.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Button (Secondary) */}
          <TouchableOpacity
            style={[styles.secondaryButton, { 
              borderColor: isLight ? '#E5E5E5' : '#333',
              backgroundColor: isLight ? '#FAFAFA' : '#121212'
            }]}
            activeOpacity={0.7}
            onPress={handleLogin}
          >
            <View>
              <Text style={[styles.secondaryBtnTitle, { color: theme.colors.textPrimary }]}>Login</Text>
              <Text style={[styles.secondaryBtnSubtitle, { color: theme.colors.textSecondary }]}>Welcome back!</Text>
            </View>
            <MaterialCommunityIcons name="login" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.termsContainer}>
            <Text style={[styles.termsText, { color: theme.colors.textTertiary }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGraphicContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  gradientSpot: {
    position: 'absolute',
    top: -width * 0.5,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbOne: {
    width: width * 0.7,
    height: width * 0.7,
    top: -width * 0.2,
    left: -width * 0.25,
  },
  orbTwo: {
    width: width * 0.5,
    height: width * 0.5,
    bottom: width * 0.1,
    right: -width * 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    justifyContent: 'space-between',
    paddingBottom: scale(40),
  },
  brandArea: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: scale(14),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(999),
  },
  badgeText: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  logo: {
    width: scale(120),
    height: scale(120),
    marginBottom: scale(24),
  },
  title: {
    fontSize: scale(42),
    fontWeight: '800',
    lineHeight: scale(48),
    marginBottom: scale(16),
  },
  subtitle: {
    fontSize: scale(16),
    lineHeight: scale(24),
    maxWidth: '90%',
  },
  actionArea: {
    gap: scale(16),
  },
  primaryButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(20),
    paddingHorizontal: scale(24),
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ skewX: '-12deg' }],
  },
  primaryBtnTitle: {
    color: '#000000',
    fontSize: scale(18),
    fontWeight: '700',
  },
  primaryBtnSubtitle: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: scale(13),
    marginTop: 2,
  },
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(20),
    paddingHorizontal: scale(24),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  secondaryBtnTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  secondaryBtnSubtitle: {
    fontSize: scale(13),
    marginTop: 2,
  },
  termsContainer: {
    marginTop: scale(16),
    alignItems: 'center',
  },
  termsText: {
    textAlign: 'center',
    fontSize: scale(11),
    lineHeight: scale(16),
  },
});
