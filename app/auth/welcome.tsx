// 'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';

const { width, height } = Dimensions.get('window');

// Brand orange color constant
const BRAND_ORANGE = '#F18902';

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
    description: 'Book a keke ride in seconds.',
    icon: 'lightning-bolt' as const,
  },
  {
    title: 'Affordable Rates',
    description: 'Transparent pricing, no surge.',
    icon: 'cash-multiple' as const,
  },
  {
    title: 'Safe & Secure',
    description: 'Verified drivers & GPS tracking.',
    icon: 'shield-check' as const,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [scrollY] = useState(new Animated.Value(0));
  const videoRef = useRef<Video>(null);

  // --- Core Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(verticalScale(50))).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  
  // Orb Animations
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  
  // Feature Card Animations (staggered)
  const feature1Anim = useRef(new Animated.Value(0)).current;
  const feature2Anim = useRef(new Animated.Value(0)).current;
  const feature3Anim = useRef(new Animated.Value(0)).current;
  
  // Button animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  
  // Shimmer effect for logo
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations with staggered timing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered feature card animations
    Animated.stagger(150, [
      Animated.spring(feature1Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(feature2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(feature3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Button glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Ambient Orb Movement with scale
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb1Y, {
            toValue: -30,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb1Scale, {
            toValue: 1.2,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Scale, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb2Y, {
            toValue: 30,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Y, {
            toValue: 0,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb2Scale, {
            toValue: 0.8,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Scale, {
            toValue: 1,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const handleProceed = () => {
    // Bounce animation on press
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.92,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/auth/choice');
    });
  };

  // Parallax effect for logo based on scroll
  const logoParallax = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const logoOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const isLight = theme.mode === 'light';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {/* Video Background */}
      <Video
        ref={videoRef}
        source={require('@assets/welcome-bg.mp4')}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
      
      {/* Background Gradient - subtle branding */}
      <LinearGradient
        colors={isLight 
          ? ['rgba(0, 0, 0, 0.65)', 'rgba(0, 0, 0, 0.45)'] 
          : ['rgba(0, 0, 0, 0.75)', 'rgba(0, 0, 0, 0.55)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      {/* Decorative Orbs with enhanced animations */}
      <Animated.View style={[styles.orb, styles.orb1, { 
        backgroundColor: BRAND_ORANGE, 
        transform: [{ translateY: orb1Y }, { scale: orb1Scale }],
        opacity: isLight ? 0.08 : 0.15
      }]} />
      
      <Animated.View style={[styles.orb, styles.orb2, { 
        backgroundColor: BRAND_ORANGE, 
        transform: [{ translateY: orb2Y }, { scale: orb2Scale }],
        opacity: isLight ? 0.05 : 0.1
      }]} />
      
      {/* Additional decorative particles */}
      <Animated.View style={[styles.particle, styles.particle1, { 
        backgroundColor: BRAND_ORANGE,
        opacity: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.1, 0.3],
        })
      }]} />
      <Animated.View style={[styles.particle, styles.particle2, { 
        backgroundColor: BRAND_ORANGE,
        opacity: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.15, 0.4],
        })
      }]} />

      {/* Theme Toggle */}
      <ThemeToggle top={insets.top + 10} right={20} />

      <Animated.ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + verticalScale(60) }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Header Section with parallax and shimmer */}
        <Animated.View style={{ 
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            { scale: logoScale },
            { translateY: logoParallax },
            { 
              rotate: logoRotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '5deg'],
              })
            }
          ]
        }}>
          <View style={[styles.logoContainer, { 
            borderColor: isLight ? '#F0F0F0' : '#222',
            shadowColor: BRAND_ORANGE,
            shadowOpacity: 0.4,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
            elevation: 10,
          }]}>
            <Image
              source={require('@assets/charter keke.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { 
          opacity: fadeAnim, 
          transform: [
            { translateY: slideUpAnim },
            { 
              translateY: scrollY.interpolate({
                inputRange: [0, 300],
                outputRange: [0, -30],
                extrapolate: 'clamp',
              })
            }
          ]
        }]}>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>Charter Keke</Text>
          <Text style={[styles.tagline, { color: theme.colors.textPrimary }]}>
            Moving Nigeria,{'\n'}One Keke at a time.
          </Text>
          <View style={styles.pillContainer}>
            <Animated.View style={[styles.pill, { 
              backgroundColor: isLight ? '#FFF5E5' : '#331D00',
              transform: [{
                scale: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                })
              }]
            }]}>
              <Text style={[styles.pillText, { color: BRAND_ORANGE }]}>Operating in Lagos</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Features List with staggered animations */}
        <Animated.View style={[styles.featuresContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
          {features.map((item, index) => {
            const featureAnim = index === 0 ? feature1Anim : index === 1 ? feature2Anim : feature3Anim;
            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.featureRow, 
                  { 
                    backgroundColor: isLight ? '#FFFFFF' : '#121212',
                    borderColor: isLight ? '#F5F5F5' : '#222',
                    opacity: featureAnim,
                    transform: [
                      {
                        translateX: featureAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        })
                      },
                      {
                        scale: featureAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }
                    ]
                  }
                ]}
              >
                <Animated.View style={[styles.iconBox, { 
                  backgroundColor: isLight ? '#FFF5E5' : '#2A1800',
                  transform: [{
                    rotate: featureAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-45deg', '0deg'],
                    })
                  }]
                }]}>
                  <MaterialCommunityIcons name={item.icon} size={24} color={BRAND_ORANGE} />
                </Animated.View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{item.description}</Text>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Bottom Action with pulse effect */}
        <Animated.View style={[styles.footer, { 
          opacity: fadeAnim, 
          transform: [
            { translateY: slideUpAnim },
            { scale: buttonScale }
          ]
        }]}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.9}
            onPress={handleProceed}
          >
            <LinearGradient
              colors={['#F18902', '#E68200']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Animated.View style={{
                transform: [{
                  translateX: buttonGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 5],
                  })
                }]
              }}>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
    alignItems: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    right: -width * 0.2,
    // blurRadius removed as it is not a valid view style
  },
  orb2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.1,
    left: -width * 0.3,
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
  },
  particle1: {
    width: 80,
    height: 80,
    top: height * 0.3,
    right: width * 0.1,
  },
  particle2: {
    width: 60,
    height: 60,
    bottom: height * 0.35,
    right: width * 0.2,
  },
  logoContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(24),
    backgroundColor: 'transparent',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
    elevation: 0,
  },
  logoImage: {
    width: scale(100),
    height: scale(100),
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  appName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: verticalScale(8),
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: moderateScale(36),
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: moderateScale(42),
    marginBottom: verticalScale(16),
  },
  pillContainer: {
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: 100,
  },
  pillText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  featuresContainer: {
    width: '100%',
    gap: verticalScale(12),
    marginBottom: verticalScale(30),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(16),
    borderWidth: 1,
    gap: scale(16),
  },
  iconBox: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  featureDesc: {
    fontSize: moderateScale(14),
  },
  footer: {
    width: '100%',
  },
  button: {
    width: '100%',
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    gap: scale(8),
  },
  buttonText: {
    color: '#000000',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});