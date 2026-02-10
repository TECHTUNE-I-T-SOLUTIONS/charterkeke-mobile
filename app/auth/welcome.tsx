// 'use client';

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, BRAND, GRADIENTS } from '@utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';

const { width, height } = Dimensions.get('window');

// Responsive scaling helpers
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const features = [
  {
    title: 'Fast & Convenient',
    description: 'Book a keke ride in seconds with just a few taps',
    icon: 'lightning-bolt' as const,
  },
  {
    title: 'Affordable Rates',
    description: 'Transparent pricing with no surge pricing',
    icon: 'cash-multiple' as const,
  },
  {
    title: 'Safe & Secure',
    description: 'Verified drivers and real-time GPS tracking',
    icon: 'shield-check' as const,
  },
  {
    title: 'Community Driven',
    description: 'Support local keke drivers and build connections',
    icon: 'account-multiple-plus' as const,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isMountedRef = useRef(true);

  // --- Entrance Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideUpAnim = useRef(new Animated.Value(verticalScale(40))).current;

  // Staggered feature card animations
  const featureAnims = useRef(
    features.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(verticalScale(30)),
    }))
  ).current;

  // CTA area entrance
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(verticalScale(20))).current;

  // --- Live Ambient Animations ---
  // Floating ambient orbs
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Opacity = useRef(new Animated.Value(0.03)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Opacity = useRef(new Animated.Value(0.02)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;
  const orb3Scale = useRef(new Animated.Value(1)).current;

  // Logo breathing animation
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoGlowOpacity = useRef(new Animated.Value(0.06)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  // Tagline shimmer
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;

  // Feature card icon gentle pulse (continuous per card)
  const featureIconPulse = useRef(features.map(() => new Animated.Value(1))).current;

  // Countdown dot blink
  const countdownBlink = useRef(new Animated.Value(1)).current;

  // Button subtle scale breathing
  const buttonBreath = useRef(new Animated.Value(1)).current;

  // Decorative line scan across CTA
  const lineScan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // === ENTRANCE ANIMATIONS ===
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 750,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered feature cards
    featureAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 550,
          delay: 450 + index * 130,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          tension: 55,
          friction: 9,
          delay: 450 + index * 130,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // CTA entrance
    Animated.parallel([
      Animated.timing(ctaFade, {
        toValue: 1,
        duration: 600,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(ctaSlide, {
        toValue: 0,
        duration: 600,
        delay: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // === LIVE AMBIENT ANIMATIONS ===

    // Floating orb 1 - slow vertical drift
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Y, {
            toValue: -verticalScale(30),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: scale(15),
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

    // Floating orb 2 - slow drift opposite direction
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2Y, {
            toValue: verticalScale(25),
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2X, {
            toValue: -scale(20),
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
            toValue: -verticalScale(15),
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

    // Floating orb 3 - scale breathing
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb3Y, {
            toValue: -verticalScale(18),
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb3Scale, {
            toValue: 1.15,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb3Y, {
            toValue: verticalScale(12),
            duration: 5500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb3Scale, {
            toValue: 0.9,
            duration: 5500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Logo breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.04,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo glow breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowOpacity, {
          toValue: 0.12,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoGlowOpacity, {
          toValue: 0.06,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow continuous subtle logo ring rotation
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Tagline shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 3000,
          delay: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Feature icon individual pulses with staggered timing
    featureIconPulse.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.12,
            duration: 1800,
            delay: index * 400,
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
    });

    // Countdown dot blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(countdownBlink, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(countdownBlink, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button subtle breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonBreath, {
          toValue: 1.015,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(buttonBreath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // CTA line scan
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineScan, {
          toValue: 1,
          duration: 4000,
          delay: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lineScan, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Auto-proceed timer
  useEffect(() => {
    const timer = setTimeout(() => {
      // Autorouter removed - user should click button instead
    }, 15000);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [router]);

  const handleProceed = () => {
    router.push('/auth/choice');
  };

  const logoRotateInterpolated = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerX = shimmerTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-scale(120), scale(120)],
  });

  const lineScanX = lineScan.interpolate({
    inputRange: [0, 1],
    outputRange: [-scale(60), width],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Theme Toggle */}
      <ThemeToggle top={insets.top + 16} right={16} />

      {/* Background Gradient */}
      <LinearGradient
        colors={theme.mode === 'light'
          ? ['rgba(124, 120, 120, 0.45)', 'rgba(121, 117, 117, 0.97)', 'rgba(48, 47, 47, 0.95)']
          : ['rgba(20, 20, 20, 0.97)', 'rgba(30, 30, 30, 0.97)', 'rgba(18, 18, 18, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundGradient}
      />

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
      <Animated.View
        style={[
          styles.decorCircle3,
          {
            transform: [{ translateY: orb3Y }, { scale: orb3Scale }],
          },
        ]}
      />

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header with Logo */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            {/* Animated glow ring */}
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  opacity: logoGlowOpacity,
                  transform: [{ scale: logoPulse }],
                },
              ]}
            />
            {/* Rotating decorative ring */}
            <Animated.View
              style={[
                styles.logoRing,
                { transform: [{ rotate: logoRotateInterpolated }] },
              ]}
            >
              <View style={styles.logoRingDot} />
            </Animated.View>
            {/* Logo image with breathing */}
            <Animated.View style={{ transform: [{ scale: logoPulse }] }}>
              <Image
                source={require('@assets/charter keke.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>Charter Keke</Text>
          <View style={[styles.taglineBadge, { backgroundColor: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)', borderColor: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}>
            <Text style={[styles.tagline, { color: theme.colors.textPrimary }]}>Your Trusted Keke, Booked in Seconds</Text>
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerX }] },
              ]}
            >
              <LinearGradient
                colors={theme.mode === 'light'
                  ? ['transparent', 'rgba(0, 0, 0, 0.1)', 'transparent']
                  : ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureCard,
                {
                  opacity: featureAnims[index].opacity,
                  transform: [{ translateY: featureAnims[index].translateY }],
                },
              ]}
            >
              <View style={styles.featureInner}>
                <View style={styles.featureIconContainer}>
                  <Animated.View style={{ transform: [{ scale: featureIconPulse[index] }] }}>
                    <LinearGradient
                      colors={theme.mode === 'light'
                        ? ['rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.02)']
                        : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
                      style={styles.featureIconBg}
                    >
                      <MaterialCommunityIcons
                        name={feature.icon}
                        size={moderateScale(22)}
                        color={theme.colors.textPrimary}
                      />
                    </LinearGradient>
                  </Animated.View>
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>{feature.description}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={moderateScale(16)}
                  color={theme.colors.textTertiary}
                />
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Call to Action */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            },
          ]}
        >
          <View style={styles.ctaDivider} />
          <Text style={styles.ctaText}>
            Fast, affordable, and safe keke rides across Lagos. Currently operating in Debari, Shomolu, and Yaba.
          </Text>
          {/* Scanning line */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateX: lineScanX }] },
            ]}
          >
            <LinearGradient
              colors={theme.mode === 'light'
                ? ['transparent', 'rgba(0, 0, 0, 0.05)', 'transparent']
                : ['transparent', 'rgba(255, 255, 255, 0.08)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanLineGradient}
            />
          </Animated.View>
        </Animated.View>

        {/* Proceed Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            },
          ]}
        >
          <Animated.View style={{ width: '100%', transform: [{ scale: buttonBreath }] }}>
            <TouchableOpacity
              onPress={handleProceed}
              style={styles.proceedButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.mode === 'light'
                  ? ['#000000', '#333333']
                  : ['#FFFFFF', '#CCCCCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={[styles.proceedButtonText, { color: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}>Get Started</Text>
                <View style={styles.arrowCircle}>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={moderateScale(16)}
                    color={theme.mode === 'light' ? '#fff' : '#000'}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Countdown Text */}
          {/* <View style={styles.countdownRow}>
            <Animated.View style={[styles.countdownDot, { opacity: countdownBlink, backgroundColor: theme.colors.textSecondary }]} />
          </View> */}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle1: {
    position: 'absolute',
    top: -height * 0.12,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(193, 232, 255, 1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -height * 0.08,
    left: -width * 0.25,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(193, 232, 255, 1)',
  },
  decorCircle3: {
    position: 'absolute',
    top: height * 0.45,
    right: -width * 0.12,
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    backgroundColor: 'rgba(193, 232, 255, 0.025)',
  },
  content: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
    marginTop: verticalScale(16),
    zIndex: 10,
  },
  logoContainer: {
    width: scale(80),
    height: scale(80),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: scale(55),
    borderWidth: 1.5,
    borderColor: 'rgba(193, 232, 255, 0.15)',
  },
  logoGlow: {
    position: 'absolute',
    width: scale(90),
    height: scale(90),
    borderRadius: scale(70),
    backgroundColor: 'rgba(193, 232, 255, 1)',
  },
  logoRing: {
    position: 'absolute',
    width: scale(100),
    height: scale(100),
    borderRadius: scale(63),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoRingDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: 'rgba(193, 232, 255, 0.35)',
    marginTop: -scale(3),
  },
  logoImage: {
    width: scale(85),
    height: scale(85),
  },
  appName: {
    fontSize: moderateScale(32),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
    marginBottom: verticalScale(10),
  },
  taglineBadge: {
    backgroundColor: 'rgba(193, 232, 255, 0.1)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.12)',
    overflow: 'hidden',
  },
  tagline: {
    fontSize: moderateScale(12),
    color: '#C1E8FF',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: scale(60),
  },
  shimmerGradient: {
    flex: 1,
  },
  featuresContainer: {
    marginBottom: verticalScale(24),
    gap: verticalScale(10),
    zIndex: 10,
  },
  featureCard: {
    borderRadius: scale(14),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.08)',
  },
  featureInner: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
  },
  featureIconContainer: {
    width: scale(40),
    height: scale(40),
  },
  featureIconBg: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(12),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: verticalScale(2),
    letterSpacing: 0.1,
  },
  featureDescription: {
    fontSize: moderateScale(11),
    color: 'rgba(193, 232, 255, 0.65)',
    lineHeight: moderateScale(16),
  },
  ctaContainer: {
    backgroundColor: 'rgba(193, 232, 255, 0.05)',
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(24),
    zIndex: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaDivider: {
    width: scale(32),
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(193, 232, 255, 0.2)',
    marginBottom: verticalScale(12),
  },
  ctaText: {
    fontSize: moderateScale(12),
    color: 'rgba(193, 232, 255, 0.8)',
    lineHeight: moderateScale(20),
    textAlign: 'center',
    fontWeight: '500',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: scale(60),
  },
  scanLineGradient: {
    flex: 1,
  },
  buttonContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  proceedButton: {
    width: '100%',
    marginBottom: verticalScale(14),
    borderRadius: scale(14),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(193, 232, 255, 0.4)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradientButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(24),
    gap: scale(12),
  },
  proceedButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: BRAND.primary,
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: BRAND.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  countdownDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: 'rgba(193, 232, 255, 0.5)',
  },
  countdownText: {
    fontSize: moderateScale(11),
    color: 'rgba(193, 232, 255, 0.6)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
