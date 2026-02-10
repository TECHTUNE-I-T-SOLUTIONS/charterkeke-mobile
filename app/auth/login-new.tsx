// 'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { COLORS, BRAND } from '@utils/colors';

const { width, height } = Dimensions.get('window');

// Responsive scaling helpers
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const { theme } = useTheme();

  const [phone, setPhone] = useState('+234');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // === ENTRANCE ANIMATIONS ===
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(verticalScale(30))).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(verticalScale(40))).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(verticalScale(30))).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  // === LIVE AMBIENT ANIMATIONS ===
  // Floating orbs
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Opacity = useRef(new Animated.Value(0.03)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Opacity = useRef(new Animated.Value(0.02)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;
  const orb3Scale = useRef(new Animated.Value(1)).current;

  // Header icon breathing
  const iconPulse = useRef(new Animated.Value(1)).current;
  const iconGlowOpacity = useRef(new Animated.Value(0.1)).current;

  // Shield pulse
  const shieldPulse = useRef(new Animated.Value(1)).current;
  const shieldGlow = useRef(new Animated.Value(0.08)).current;

  // Button breathing
  const buttonBreath = useRef(new Animated.Value(1)).current;

  // Decorative ring rotation
  const ringRotate = useRef(new Animated.Value(0)).current;

  // Input focus glow
  const inputGlow = useRef(new Animated.Value(0)).current;

  // Divider shimmer
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // === ENTRANCE ===
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(headerSlide, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(ctaSlide, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // === LIVE AMBIENT ANIMATIONS ===

    // Floating orb 1
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Y, {
            toValue: -verticalScale(25),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: scale(12),
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
            toValue: verticalScale(18),
            duration: 7000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: -scale(8),
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
            toValue: verticalScale(20),
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb2X, {
            toValue: -scale(15),
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
            toValue: scale(10),
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

    // Floating orb 3 - breathing scale
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb3Y, {
            toValue: -verticalScale(12),
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb3Scale, {
            toValue: 1.3,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb3Y, {
            toValue: verticalScale(10),
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb3Scale, {
            toValue: 0.85,
            duration: 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Header icon breathing
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(iconPulse, {
            toValue: 1.06,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconGlowOpacity, {
            toValue: 0.2,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(iconPulse, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconGlowOpacity, {
            toValue: 0.1,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Shield security pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shieldPulse, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(shieldGlow, {
            toValue: 0.18,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(shieldPulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(shieldGlow, {
            toValue: 0.08,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Button breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonBreath, {
          toValue: 1.015,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(buttonBreath, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Decorative ring slow rotation
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Input area subtle glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(inputGlow, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(inputGlow, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Divider shimmer sweep
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(shimmerTranslate, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Shake on error
  const triggerErrorShake = () => {
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (phone.length < 11) {
      newErrors.phone = 'Enter a valid phone number';
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerErrorShake();
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const loggedInUser = await login(phone, password);
      
      console.log('🎯 [LOGIN-SCREEN] User returned from login:', { 
        userExists: !!loggedInUser,
        id: loggedInUser?.id,
        role: (loggedInUser as any)?.role,
        hasRole: !!(loggedInUser as any)?.role,
        userKeys: loggedInUser ? Object.keys(loggedInUser) : [],
        userString: JSON.stringify(loggedInUser)
      });

      if (!loggedInUser) {
        throw new Error('No user data returned from login');
      }

      const userRole = (loggedInUser as any)?.role;
      if (!userRole) {
        console.error('❌ [LOGIN-SCREEN] User role is undefined!', loggedInUser);
        throw new Error('User role information is missing. Please try logging in again.');
      }

      // Route based on user role
      if (userRole === 'driver') {
        console.log('🚗 [LOGIN] Routing driver to /driver/home');
        router.push('/driver/home');
      } else if (userRole === 'rider') {
        console.log('🚕 [LOGIN] Routing rider to /rider/home');
        router.push('/rider/home');
      } else {
        throw new Error(`Unknown user role: ${userRole}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ [LOGIN-SCREEN] Login error:', errorMessage);
      setErrors({
        submit: errorMessage,
      });
      triggerErrorShake();
    }
  };

  const ringSpin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const InputField = useMemo(() => {
    return ({ label, error, icon, rightIcon, onRightIconPress, ...props }: any) => (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
          <View style={styles.inputIconContainer}>
            <MaterialCommunityIcons
              name={icon}
              size={moderateScale(18)}
              color={theme.colors.textSecondary}
            />
          </View>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholderTextColor={theme.colors.placeholder}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={rightIcon}
                size={moderateScale(18)}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={moderateScale(11)} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }, [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Theme Toggle */}
      <ThemeToggle top={insets.top + 16} right={16} />

      <LinearGradient
        colors={theme.mode === 'light'
          ? ['rgba(187, 175, 175, 0.97)', 'rgba(56, 56, 56, 0.66)', 'rgba(68, 66, 66, 0.95)']
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

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <Animated.View style={{ opacity: headerFade }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <View style={styles.backButtonInner}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={moderateScale(18)}
                    color={theme.colors.textPrimary}
                  />
                </View>
                <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Back</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Header with animated icon */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: headerFade,
                  transform: [{ translateY: headerSlide }],
                },
              ]}
            >
              <View style={styles.headerIconWrapper}>
                {/* Animated glow ring */}
                <Animated.View
                  style={[
                    styles.iconGlowRing,
                    {
                      opacity: iconGlowOpacity,
                      transform: [{ scale: iconPulse }],
                    },
                  ]}
                />
                {/* Rotating decorative ring */}
                <Animated.View
                  style={[
                    styles.decorRing,
                    { transform: [{ rotate: ringSpin }] },
                  ]}
                >
                  <View style={styles.decorRingDot} />
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: iconPulse }] }}>
                  <LinearGradient
                    colors={theme.mode === 'light'
                      ? ['rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.02)']
                      : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
                    style={styles.headerIconBg}
                  >
                    <MaterialCommunityIcons
                      name="login-variant"
                      size={moderateScale(30)}
                      color={theme.colors.textPrimary}
                    />
                  </LinearGradient>
                </Animated.View>
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Sign in to your Charter Keke account
              </Text>
            </Animated.View>

            {/* Error Message */}
            {errors.submit && (
              <Animated.View
                style={[
                  styles.errorContainer,
                  { transform: [{ translateX: errorShake }] },
                ]}
              >
                <View style={styles.errorIconCircle}>
                  <MaterialCommunityIcons name="alert-circle" size={moderateScale(16)} color="#FF6B6B" />
                </View>
                <Text style={styles.errorMessage}>{errors.submit}</Text>
              </Animated.View>
            )}

            {/* Form with subtle ambient glow */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: formFade,
                  transform: [{ translateY: formSlide }, { translateX: errorShake }],
                },
              ]}
            >
              <View style={styles.formCard}>
                {/* Subtle animated glow on form card */}
                <Animated.View
                  style={[
                    styles.formCardGlow,
                    {
                      opacity: inputGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.04],
                      }),
                    },
                  ]}
                />

                {/* Phone Input */}
                <InputField
                  label="PHONE NUMBER"
                  placeholder="+234 901 234 5678"
                  keyboardType="phone-pad"
                  icon="phone-outline"
                  value={phone}
                  onChangeText={setPhone}
                  error={errors.phone}
                />

                {/* Password Input */}
                <InputField
                  label="PASSWORD"
                  placeholder="Enter your password"
                  icon="lock-outline"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={() => router.push('/auth/reset-password')}
                  style={styles.forgotContainer}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotText, { color: theme.colors.textSecondary }]}>Forgot Password?</Text>
                  <MaterialCommunityIcons name="arrow-right" size={moderateScale(12)} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Login Button with breathing */}
              <Animated.View style={{ transform: [{ scale: buttonBreath }] }}>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  style={styles.loginButton}
                >
                  <LinearGradient
                    colors={theme.mode === 'light'
                      ? ['#000000', '#333333']
                      : ['#FFFFFF', '#CCCCCC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={theme.mode === 'light' ? '#FFFFFF' : '#000000'} />
                    ) : (
                      <>
                        <Text style={[styles.loginButtonText, { color: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}>Sign In</Text>
                        <View style={styles.buttonArrowCircle}>
                          <MaterialCommunityIcons
                            name="arrow-right"
                            size={moderateScale(16)}
                            color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
                          />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider with shimmer */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine}>
                  <Animated.View
                    style={[
                      styles.dividerShimmer,
                      {
                        transform: [
                          {
                            translateX: shimmerTranslate.interpolate({
                              inputRange: [-1, 1],
                              outputRange: [-width * 0.4, width * 0.4],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
                <View style={styles.dividerBadge}>
                  <Text style={styles.dividerText}>New to Charter Keke?</Text>
                </View>
                <View style={styles.dividerLine}>
                  <Animated.View
                    style={[
                      styles.dividerShimmer,
                      {
                        transform: [
                          {
                            translateX: shimmerTranslate.interpolate({
                              inputRange: [-1, 1],
                              outputRange: [width * 0.4, -width * 0.4],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Sign Up Link */}
              <TouchableOpacity
                onPress={() => router.push('/auth/signup-new')}
                activeOpacity={0.85}
                style={styles.signupButton}
              >
                <View style={styles.signupButtonContent}>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={moderateScale(18)}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={[styles.signupButtonText, { color: theme.colors.textPrimary }]}>Create New Account</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Security Info with animated shield */}
            <Animated.View
              style={[
                styles.securityInfo,
                {
                  opacity: ctaFade,
                  transform: [{ translateY: ctaSlide }],
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: shieldPulse }] }}>
                <Animated.View
                  style={[
                    styles.shieldGlowRing,
                    { opacity: shieldGlow },
                  ]}
                />
                <LinearGradient
                  colors={theme.mode === 'light'
                    ? ['rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.02)']
                    : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
                  style={styles.securityIconBg}
                >
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={moderateScale(18)}
                    color={theme.colors.textPrimary}
                  />
                </LinearGradient>
              </Animated.View>
              <View style={styles.securityTextContainer}>
                <Text style={[styles.securityTitle, { color: theme.colors.textPrimary }]}>Your data is safe with us</Text>
                <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
                  Encrypted and secure. We never share your information.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    top: -height * 0.08,
    right: -width * 0.15,
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: 'rgba(193, 232, 255, 0.04)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: height * 0.1,
    left: -width * 0.2,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(193, 232, 255, 0.03)',
  },
  decorCircle3: {
    position: 'absolute',
    top: height * 0.4,
    right: -width * 0.1,
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(193, 232, 255, 0.015)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(40),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(16),
    paddingVertical: verticalScale(6),
    alignSelf: 'flex-start',
  },
  backButtonInner: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: moderateScale(14),
    color: '#C1E8FF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  headerIconWrapper: {
    marginBottom: verticalScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlowRing: {
    position: 'absolute',
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: 'rgba(193, 232, 255, 0.1)',
  },
  decorRing: {
    position: 'absolute',
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.06)',
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  decorRingDot: {
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: 'rgba(193, 232, 255, 0.3)',
    marginTop: -scale(2.5),
  },
  headerIconBg: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: verticalScale(8),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: moderateScale(13),
    color: 'rgba(193, 232, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    padding: scale(14),
    marginBottom: verticalScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  errorIconCircle: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    color: '#FF9B9B',
    fontSize: moderateScale(12),
    fontWeight: '600',
    flex: 1,
    lineHeight: moderateScale(18),
  },
  formContainer: {
    gap: verticalScale(10),
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.08)',
    padding: scale(20),
    gap: verticalScale(10),
    overflow: 'hidden',
  },
  formCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(193, 232, 255, 1)',
    borderRadius: scale(18),
  },
  inputGroup: {
    gap: verticalScale(6),
  },
  inputLabel: {
    color: 'rgba(193, 232, 255, 0.6)',
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    marginLeft: scale(2),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
  },
  inputWrapperError: {
    borderColor: 'rgba(255, 107, 107, 0.4)',
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
  },
  inputIconContainer: {
    width: scale(44),
    height: scale(48),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(193, 232, 255, 0.06)',
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(14),
    color: '#ffffff',
    fontWeight: '500',
  },
  rightIconBtn: {
    width: scale(44),
    height: scale(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginLeft: scale(2),
  },
  errorText: {
    color: '#FF9B9B',
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  forgotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: scale(4),
    paddingVertical: verticalScale(2),
  },
  forgotText: {
    color: '#C1E8FF',
    fontSize: moderateScale(12),
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  loginButton: {
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
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(24),
    gap: scale(12),
  },
  loginButtonText: {
    color: BRAND.primary,
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  buttonArrowCircle: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: BRAND.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(193, 232, 255, 0.1)',
    overflow: 'hidden',
  },
  dividerShimmer: {
    position: 'absolute',
    top: 0,
    width: scale(40),
    height: 1,
    backgroundColor: 'rgba(193, 232, 255, 0.35)',
  },
  dividerBadge: {
    backgroundColor: 'rgba(193, 232, 255, 0.06)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: scale(10),
  },
  dividerText: {
    color: 'rgba(193, 232, 255, 0.5)',
    fontSize: moderateScale(11),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  signupButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(193, 232, 255, 0.15)',
    borderRadius: scale(14),
    paddingVertical: verticalScale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  signupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(10),
  },
  signupButtonText: {
    color: '#C1E8FF',
    fontSize: moderateScale(14),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  securityInfo: {
    marginTop: verticalScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.08)',
    padding: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
  },
  shieldGlowRing: {
    position: 'absolute',
    width: scale(54),
    height: scale(54),
    borderRadius: scale(27),
    backgroundColor: 'rgba(193, 232, 255, 0.15)',
    top: -scale(7),
    left: -scale(7),
  },
  securityIconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    color: '#C1E8FF',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: verticalScale(2),
    letterSpacing: 0.1,
  },
  securityText: {
    color: 'rgba(193, 232, 255, 0.6)',
    fontSize: moderateScale(11),
    lineHeight: moderateScale(17),
    fontWeight: '500',
  },
});
