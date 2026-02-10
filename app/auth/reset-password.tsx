// 'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { BRAND } from '@utils/colors';

const { width, height } = Dimensions.get('window');

// Responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type ResetStep = 'email' | 'otp' | 'password';

const STEP_CONFIG = {
  email: {
    icon: 'email-outline' as const,
    title: 'Enter Your Email',
    description: "We'll send you an OTP to verify your account",
  },
  otp: {
    icon: 'shield-key-outline' as const,
    title: 'Verify OTP',
    description: '',
  },
  password: {
    icon: 'lock-reset' as const,
    title: 'Create New Password',
    description: 'Choose a strong password for your account',
  },
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized handlers to prevent keyboard focus loss
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (text.trim()) setErrors((prev) => ({ ...prev, email: '' }));
  }, []);

  const handleOtpChange = useCallback((text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setOtp(numericText);
    if (numericText.trim()) setErrors((prev) => ({ ...prev, otp: '' }));
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (text.trim()) setErrors((prev) => ({ ...prev, password: '' }));
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
    if (text.trim()) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
  }, []);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const triggerAnimation = () => {
    slideAnim.setValue(0);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  React.useEffect(() => {
    triggerAnimation();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOtp = async () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Enter a valid email';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCurrentStep('otp');
      setResendTimer(60);
      setErrors({});
      setTimeout(triggerAnimation, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const newErrors: Record<string, string> = {};

    if (!otp.trim()) newErrors.otp = 'OTP is required';
    else if (otp.length !== 6) newErrors.otp = 'OTP must be 6 digits';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCurrentStep('password');
      setErrors({});
      setTimeout(triggerAnimation, 100);
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};

    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Minimum 8 characters required';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Password reset successfully!');
      router.push('/auth/login-new');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const PasswordRequirements = () => (
    <View style={styles.requirementsContainer}>
      {[
        { text: 'At least 8 characters', met: password.length >= 8 },
        { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { text: 'Contains number', met: /[0-9]/.test(password) },
        { text: 'Contains special character', met: /[!@#$%^&*]/.test(password) },
      ].map((req, idx) => (
        <View key={idx} style={styles.requirement}>
          <View
            style={[
              styles.requirementDot,
              { backgroundColor: req.met ? '#10B981' : theme.colors.surfaceLight },
            ]}
          />
          <Text style={[styles.requirementText, req.met && styles.requirementMet]}>
            {req.text}
          </Text>
        </View>
      ))}
    </View>
  );

  const StepIndicator = () => {
    const steps: ResetStep[] = ['email', 'otp', 'password'];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted =
            steps.indexOf(step) < steps.indexOf(currentStep);
          const isFuture = !isActive && !isCompleted;

          return (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : isActive
                        ? theme.colors.surfaceLight
                        : 'rgba(255,255,255,0.05)',
                      borderWidth: isActive ? 2 : 0,
                      borderColor: isActive ? theme.colors.textPrimary : 'transparent',
                    },
                  ]}
                >
                  {isCompleted ? (
                    <MaterialCommunityIcons name="check" size={moderateScale(14)} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        { opacity: isFuture ? 0.35 : 1, color: theme.colors.textPrimary },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : theme.colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const currentConfig = STEP_CONFIG[currentStep];

  return (
    <LinearGradient
      colors={theme.mode === 'light'
        ? ['rgba(240, 240, 240, 0.97)', 'rgba(131, 131, 131, 0.97)', 'rgba(77, 77, 77, 0.95)']
        : ['rgba(20, 20, 20, 0.97)', 'rgba(30, 30, 30, 0.97)', 'rgba(18, 18, 18, 0.95)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={styles.container}
    >
      {/* Theme Toggle */}
      <ThemeToggle top={insets.top + 16} right={16} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <View style={styles.backCircle}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={moderateScale(18)}
                    color={theme.colors.textPrimary}
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset Password</Text>
              <View style={{ width: scale(34) }} />
            </View>

            {/* Progress Indicator */}
            <StepIndicator />

            {/* Step Icon Header */}
            <Animated.View
              style={[
                styles.stepIconHeader,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.stepIconCircle}>
                <MaterialCommunityIcons
                  name={currentConfig.icon}
                  size={moderateScale(28)}
                  color={theme.colors.textPrimary}
                />
              </View>
            </Animated.View>

            {/* Content Section */}
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                    { scale: scaleAnim },
                  ],
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Step 1: Email */}
              {currentStep === 'email' && (
                <View>
                  <Text style={styles.stepTitle}>{currentConfig.title}</Text>
                  <Text style={styles.stepDescription}>
                    {currentConfig.description}
                  </Text>

                  <View style={styles.form}>
                    <View>
                      <Text style={styles.label}>Email Address</Text>
                      <View style={[styles.inputContainer, errors.email ? styles.inputContainerError : null]}>
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={moderateScale(18)}
                          color={theme.colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="john@example.com"
                          placeholderTextColor={theme.colors.border}
                          keyboardType="email-address"
                          editable={!isLoading}
                          value={email}
                          onChangeText={handleEmailChange}
                        />
                      </View>
                      {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={isLoading}
                      style={styles.button}
                      activeOpacity={0.85}
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
                            <Text style={[styles.buttonText, { color: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}>Send OTP</Text>
                            <View style={styles.btnArrowBg}>
                              <MaterialCommunityIcons
                                name="send"
                                size={moderateScale(14)}
                                color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
                              />
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Step 2: OTP Verification */}
              {currentStep === 'otp' && (
                <View>
                  <Text style={styles.stepTitle}>{currentConfig.title}</Text>
                  <Text style={styles.stepDescription}>
                    Enter the 6-digit code sent to{' '}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>

                  <View style={styles.form}>
                    <View>
                      <Text style={styles.label}>One-Time Password</Text>
                      <View style={[styles.inputContainer, errors.otp ? styles.inputContainerError : null]}>
                        <MaterialCommunityIcons
                          name="shield-key-outline"
                          size={moderateScale(18)}
                          color={theme.colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="000000"
                          placeholderTextColor={theme.colors.border}
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!isLoading}
                          value={otp}
                          onChangeText={handleOtpChange}
                        />
                      </View>
                      {errors.otp && (
                        <Text style={styles.errorText}>{errors.otp}</Text>
                      )}
                    </View>

                    <View style={styles.resendContainer}>
                      {resendTimer > 0 ? (
                        <View style={styles.resendRow}>
                          <MaterialCommunityIcons
                            name="timer-outline"
                            size={moderateScale(14)}
                            color={theme.colors.textSecondary}
                          />
                          <Text style={styles.resendText}>
                            Resend OTP in {resendTimer}s
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSendOtp()}
                          style={styles.resendButton}
                        >
                          <MaterialCommunityIcons
                            name="refresh"
                            size={moderateScale(14)}
                            color={theme.colors.textPrimary}
                          />
                          <Text style={styles.resendLink}>Resend OTP</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      disabled={isLoading}
                      style={styles.button}
                      activeOpacity={0.85}
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
                            <Text style={[styles.buttonText, { color: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}>Verify OTP</Text>
                            <View style={styles.btnArrowBg}>
                              <MaterialCommunityIcons
                                name="check"
                                size={moderateScale(14)}
                                color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
                              />
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Step 3: New Password */}
              {currentStep === 'password' && (
                <View>
                  <Text style={styles.stepTitle}>{currentConfig.title}</Text>
                  <Text style={styles.stepDescription}>
                    {currentConfig.description}
                  </Text>

                  <View style={styles.form}>
                    <View>
                      <Text style={styles.label}>New Password</Text>
                      <View style={[styles.inputContainer, errors.password ? styles.inputContainerError : null]}>
                        <MaterialCommunityIcons
                          name="lock-outline"
                          size={moderateScale(18)}
                          color={theme.colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, styles.passwordInput]}
                          placeholder="At least 8 characters"
                          placeholderTextColor={theme.colors.border}
                          secureTextEntry={!showPassword}
                          editable={!isLoading}
                          value={password}
                          onChangeText={handlePasswordChange}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          <MaterialCommunityIcons
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={moderateScale(16)}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      )}
                    </View>

                    <PasswordRequirements />

                    <View>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          errors.confirmPassword ? styles.inputContainerError : null,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="lock-check-outline"
                          size={moderateScale(18)}
                          color={theme.colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, styles.passwordInput]}
                          placeholder="Re-enter password"
                          placeholderTextColor={theme.colors.border}
                          secureTextEntry={!showConfirmPassword}
                          editable={!isLoading}
                          value={confirmPassword}
                          onChangeText={handleConfirmPasswordChange}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <MaterialCommunityIcons
                            name={showConfirmPassword ? 'eye' : 'eye-off'}
                            size={moderateScale(16)}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={handleResetPassword}
                      disabled={isLoading}
                      style={styles.button}
                      activeOpacity={0.85}
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
                            <Text style={[styles.buttonText, { color: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}>Reset Password</Text>
                            <View style={styles.btnArrowBg}>
                              <MaterialCommunityIcons
                                name="check-all"
                                size={moderateScale(14)}
                                color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
                              />
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Back to Login */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login-new')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(14),
  },
  backButton: {
    padding: scale(2),
  },
  backCircle: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    marginBottom: verticalScale(24),
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#C1E8FF',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: scale(8),
  },
  stepIconHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  stepIconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(193, 232, 255, 0.1)',
  },
  contentContainer: {
    paddingHorizontal: scale(24),
  },
  stepTitle: {
    color: '#fff',
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginBottom: verticalScale(6),
    letterSpacing: 0.1,
  },
  stepDescription: {
    color: 'rgba(193, 232, 255, 0.65)',
    fontSize: moderateScale(12),
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(18),
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  emailHighlight: {
    color: '#C1E8FF',
    fontWeight: '700',
  },
  form: {
    gap: verticalScale(16),
  },
  label: {
    color: 'rgba(193, 232, 255, 0.8)',
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginBottom: verticalScale(6),
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    borderWidth: 1.5,
    borderColor: 'rgba(193, 232, 255, 0.08)',
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  inputIcon: {
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(14),
    fontSize: moderateScale(13),
    color: '#ffffff',
    fontWeight: '500',
  },
  otpInput: {
    letterSpacing: scale(8),
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  passwordInput: {
    paddingRight: scale(40),
  },
  eyeIcon: {
    padding: scale(6),
  },
  errorText: {
    color: '#fca5a5',
    fontSize: moderateScale(10),
    marginTop: verticalScale(4),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  requirementsContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: scale(12),
    padding: scale(14),
    gap: verticalScale(10),
    borderWidth: 1,
    borderColor: 'rgba(193, 232, 255, 0.06)',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  requirementDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  requirementText: {
    color: 'rgba(193, 232, 255, 0.4)',
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  requirementMet: {
    color: '#10B981',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  resendText: {
    color: 'rgba(193, 232, 255, 0.5)',
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(14),
    borderRadius: scale(20),
    backgroundColor: 'rgba(193, 232, 255, 0.08)',
  },
  resendLink: {
    color: '#C1E8FF',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  button: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginTop: verticalScale(4),
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(193, 232, 255, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: verticalScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(10),
  },
  buttonText: {
    color: BRAND.primary,
    fontWeight: '800',
    fontSize: moderateScale(14),
    letterSpacing: 0.2,
  },
  btnArrowBg: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: 'rgba(5, 38, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    gap: scale(4),
  },
  footerText: {
    color: 'rgba(193, 232, 255, 0.5)',
    fontSize: moderateScale(12),
  },
  footerLink: {
    color: '#C1E8FF',
    fontSize: moderateScale(12),
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
