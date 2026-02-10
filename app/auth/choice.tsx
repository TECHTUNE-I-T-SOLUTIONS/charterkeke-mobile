// 'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { COLORS, BRAND } from '@utils/colors';

const { width, height } = Dimensions.get('window');

// Responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const benefits = [
  {
    icon: 'lightning-bolt' as const,
    name: 'Instant Booking',
    desc: 'Book a ride in seconds',
  },
  {
    icon: 'cash-multiple' as const,
    name: 'Fair Pricing',
    desc: 'No surge, transparent rates',
  },
  {
    icon: 'shield-check' as const,
    name: 'Safety Assured',
    desc: 'Verified drivers & GPS tracking',
  },
  {
    icon: 'account-multiple-plus' as const,
    name: 'Community',
    desc: 'Support local keke drivers',
  },
];

export default function AuthChoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();  const { theme } = useTheme();
  // === ENTRANCE ANIMATIONS ===
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [benefitAnims] = useState(
    benefits.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-16),
    }))
  );

  // === LIVE AMBIENT ANIMATIONS ===
  // Floating orbs
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Opacity = useRef(new Animated.Value(0.03)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Opacity = useRef(new Animated.Value(0.02)).current;

  // Logo breathing
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoGlowOpacity = useRef(new Animated.Value(0.05)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  // Button shimmer
  const buttonShimmer = useRef(new Animated.Value(-1)).current;

  // Benefit icon pulses (staggered)
  const benefitIconPulse = useRef(benefits.map(() => new Animated.Value(1))).current;

  // Secondary button border glow
  const borderGlow = useRef(new Animated.Value(0)).current;

  // Subtitle dash width animation
  const dashWidth = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // === ENTRANCE ===
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger benefit items
    benefitAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: 500 + index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: 0,
          duration: 400,
          delay: 500 + index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // === LIVE AMBIENT ===

    // Floating orb 1
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Y, {
            toValue: -verticalScale(28),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: scale(14),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Opacity, {
            toValue: 0.06,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb1Y, {
            toValue: verticalScale(20),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: -scale(10),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Opacity, {
            toValue: 0.03,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Floating orb 2
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2Y, {
            toValue: verticalScale(22),
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2X, {
            toValue: -scale(16),
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Opacity, {
            toValue: 0.05,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb2Y, {
            toValue: -verticalScale(16),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2X, {
            toValue: scale(12),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Opacity, {
            toValue: 0.02,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Logo breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoPulse, {
            toValue: 1.05,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoGlowOpacity, {
            toValue: 0.12,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoPulse, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoGlowOpacity, {
            toValue: 0.05,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Logo decorative ring rotation
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Button shimmer sweep
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonShimmer, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(buttonShimmer, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered benefit icon pulses
    benefitIconPulse.forEach((anim, index) => {
      const delay = index * 600;
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.12,
              duration: 1800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    });

    // Secondary button border glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlow, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(borderGlow, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtitle dash breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(dashWidth, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(dashWidth, {
          toValue: 0.6,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSignup = () => {
    router.push('/auth/signup-new');
  };

  const handleLogin = () => {
    router.push('/auth/login-new');
  };

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={theme.mode === 'light'
        ? ['#E2DDDD', '#6B6767', '#3A3838']
        : ['#121212', '#1E1E1E', '#121212']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Theme Toggle */}
      <ThemeToggle top={insets.top + 16} right={16} />

      {/* Animated floating orbs */}
      <Animated.View
        style={[
          styles.decorCircle1,
          {
            opacity: orb1Opacity,
            transform: [{ translateY: orb1Y }, { translateX: orb1X }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorCircle2,
          {
            opacity: orb2Opacity,
            transform: [{ translateY: orb2Y }, { translateX: orb2X }],
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            {/* Animated glow */}
            <Animated.View
              style={[
                styles.logoGlow,
                { opacity: logoGlowOpacity },
              ]}
            />
            {/* Rotating decorative ring */}
            <Animated.View
              style={[
                styles.logoRing,
                { transform: [{ rotate: logoSpin }] },
              ]}
            >
              <View style={styles.logoRingDot} />
            </Animated.View>
            <Animated.View style={{ transform: [{ scale: logoPulse }] }}>
              <Image
                source={require('@assets/charter keke.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          <Text style={[styles.welcome, { color: theme.colors.textPrimary }]}>Welcome to{'\n'}Charter Keke</Text>
          <View style={styles.subtitleRow}>
            <Animated.View
              style={[
                styles.subtitleDash,
                { transform: [{ scaleX: dashWidth }], backgroundColor: theme.colors.border },
              ]}
            />
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Your trusted keke ride-sharing platform
            </Text>
            <Animated.View
              style={[
                styles.subtitleDash,
                { transform: [{ scaleX: dashWidth }], backgroundColor: theme.colors.border },
              ]}
            />
          </View>
        </Animated.View>

        {/* Auth Options */}
        <Animated.View
          style={[
            styles.optionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Signup Option with shimmer */}
          <TouchableOpacity
            onPress={handleSignup}
            activeOpacity={0.85}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={theme.mode === 'light'
                ? ['#000000', '#333333']
                : ['#FFFFFF', '#CCCCCC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {/* Shimmer overlay */}
              <Animated.View
                style={[
                  styles.buttonShimmerOverlay,
                  {
                    transform: [
                      {
                        translateX: buttonShimmer.interpolate({
                          inputRange: [-1, 1],
                          outputRange: [-width, width],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <View style={styles.buttonLeft}>
                <View style={styles.buttonIconCircle}>
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={moderateScale(20)}
                    color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
                  />
                </View>
                <View>
                  <Text style={[styles.primaryButtonText, { color: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}>Get Started</Text>
                  <Text style={[styles.primaryButtonSubtext, { color: theme.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }]}>
                    Create a new account
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="arrow-right"
                size={moderateScale(20)}
                color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Option with border glow */}
          <Animated.View
            style={{
              opacity: borderGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              }),
            }}
          >
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              style={styles.secondaryButton}
            >
              <Animated.View
                style={[
                  styles.secondaryBorderGlow,
                  {
                    opacity: borderGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.08],
                    }),
                  },
                ]}
              />
              <View style={styles.secondaryInner}>
                <View style={styles.buttonLeft}>
                  <View style={styles.secondaryIconCircle}>
                    <MaterialCommunityIcons
                      name="login"
                      size={moderateScale(20)}
                      color={theme.colors.textPrimary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>Sign In</Text>
                    <Text style={[styles.secondaryButtonSubtext, { color: theme.colors.textSecondary }]}>
                      Already have an account
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={moderateScale(20)}
                  color={theme.colors.textTertiary}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Benefits with animated icons */}
        <Animated.View
          style={[
            styles.benefitsContainer,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.benefitsTitleRow}>
            <View style={styles.benefitsTitleLine} />
            <Text style={[styles.benefitsTitle, { color: theme.colors.textPrimary }]}>Why Choose Charter Keke?</Text>
            <View style={[styles.benefitsTitleLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <Animated.View
                key={benefit.name}
                style={[
                  styles.benefitItem,
                  {
                    opacity: benefitAnims[index].opacity,
                    transform: [{ translateX: benefitAnims[index].translateX }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.benefitIconBg,
                    { transform: [{ scale: benefitIconPulse[index] }] },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={benefit.icon}
                    size={moderateScale(18)}
                    color={theme.colors.textPrimary}
                  />
                </Animated.View>
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitName, { color: theme.colors.textPrimary }]}>{benefit.name}</Text>
                  <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>{benefit.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorCircle1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.15,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(193, 232, 255, 0.04)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -height * 0.05,
    left: -width * 0.2,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(193, 232, 255, 0.03)',
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(36),
  },
  logoContainer: {
    width: scale(96),
    height: scale(96),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: scale(48),
    borderWidth: 1.5,
    borderColor: 'rgba(193, 232, 255, 0.12)',
  },
  logoGlow: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
  },
  logoRing: {
    position: 'absolute',
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.06)',
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoRingDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: 'rgba(193, 232, 255, 0.3)',
    marginTop: -scale(2.5),
  },
  logoImage: {
    width: scale(72),
    height: scale(72),
  },
  welcome: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: verticalScale(12),
    textAlign: 'center',
    lineHeight: moderateScale(34),
    letterSpacing: 0.2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  subtitleDash: {
    width: scale(20),
    height: 1.5,
    backgroundColor: 'rgba(193, 232, 255, 0.25)',
    borderRadius: 1,
  },
  subtitle: {
    fontSize: moderateScale(12),
    color: 'rgba(193, 232, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  optionsContainer: {
    marginBottom: verticalScale(32),
    gap: verticalScale(14),
  },
  primaryButton: {
    overflow: 'hidden',
    borderRadius: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(193, 232, 255, 0.35)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientButton: {
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  buttonShimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: scale(60),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
  },
  buttonIconCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: 'rgba(5, 38, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: BRAND.primary,
    marginBottom: verticalScale(1),
    letterSpacing: 0.2,
  },
  primaryButtonSubtext: {
    fontSize: moderateScale(11),
    color: BRAND.primary,
    opacity: 0.6,
    fontWeight: '500',
  },
  secondaryButton: {
    overflow: 'hidden',
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: 'rgba(193, 232, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  secondaryBorderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(193, 232, 255, 1)',
    borderRadius: scale(16),
  },
  secondaryInner: {
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryIconCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: verticalScale(1),
    letterSpacing: 0.2,
  },
  secondaryButtonSubtext: {
    fontSize: moderateScale(11),
    color: 'rgba(193, 232, 255, 0.65)',
    fontWeight: '500',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.08)',
    paddingVertical: verticalScale(22),
    paddingHorizontal: scale(20),
  },
  benefitsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
    gap: scale(10),
  },
  benefitsTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(193, 232, 255, 0.1)',
  },
  benefitsTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  benefitsGrid: {
    gap: verticalScale(16),
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
  },
  benefitIconBg: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.06)',
  },
  benefitText: {
    flex: 1,
  },
  benefitName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#C1E8FF',
    marginBottom: verticalScale(2),
    letterSpacing: 0.1,
  },
  benefitDesc: {
    fontSize: moderateScale(11),
    color: 'rgba(193, 232, 255, 0.55)',
    fontWeight: '400',
  },
});
