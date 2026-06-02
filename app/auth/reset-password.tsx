import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { BRAND, COLORS } from '@utils/colors';

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
    description: 'Enter the 6-digit code sent to your email',
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
  const scheme = useColorScheme();
  const { theme } = useTheme();

  const colors = theme?.colors
    ? theme.colors
    : scheme === 'dark'
      ? COLORS.dark
      : COLORS.light;

  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms'>('email');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const triggerAnimation = () => {
    slideAnim.setValue(0);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.96);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
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

  useEffect(() => {
    triggerAnimation();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSendOtp = async () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Enter a valid email';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsLoading(true);
    try {
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.vercel.app/api';
      const response = await fetch(`${API_BASE}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          type: 'forgot_password',
          deliveryMethod,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors({ email: data?.message || data?.error || 'Failed to send OTP' });
        return;
      }

      setCurrentStep('otp');
      setResendTimer(60);
      setErrors({});
      setTimeout(triggerAnimation, 100);
    } catch (error: any) {
      Alert.alert('Error', `Failed to send OTP: ${error?.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const newErrors: Record<string, string> = {};
    if (!otp.trim()) newErrors.otp = 'OTP is required';
    else if (otp.length !== 6) newErrors.otp = 'OTP must be 6 digits';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsLoading(true);
    try {
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.vercel.app/api';
      const response = await fetch(`${API_BASE}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otp.trim(),
          type: 'forgot_password',
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setErrors({ otp: data?.error || 'Invalid OTP' });
        return;
      }

      setCurrentStep('password');
      setErrors({});
      setTimeout(triggerAnimation, 100);
    } catch (error: any) {
      Alert.alert('Error', `Failed to verify OTP: ${error?.message || 'Invalid OTP'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Minimum 8 characters required';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsLoading(true);
    try {
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.vercel.app/api';
      const response = await fetch(`${API_BASE}/auth/reset-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword: password,
          method: deliveryMethod,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        Alert.alert('Error', data?.error || data?.message || 'Failed to reset password');
        return;
      }

      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'OK', onPress: () => router.push('/auth/login-new') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = useMemo(
    () => [
      { text: 'At least 8 characters', met: password.length >= 8 },
      { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'Contains number', met: /[0-9]/.test(password) },
      { text: 'Contains special character', met: /[!@#$%^&*]/.test(password) },
    ],
    [password]
  );

  const currentConfig = STEP_CONFIG[currentStep];
  const isDark = colors.background === COLORS.dark.background;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ThemeToggle top={insets.top + 16} right={16} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reset Password</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.stepIndicator}>
              {(['email', 'otp', 'password'] as ResetStep[]).map((step, index, arr) => {
                const isActive = step === currentStep;
                const isCompleted = arr.indexOf(step) < arr.indexOf(currentStep);
                return (
                  <React.Fragment key={step}>
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: isCompleted ? BRAND.primary : isActive ? `${BRAND.primary}20` : colors.surface,
                          borderColor: isCompleted || isActive ? BRAND.primary : colors.border,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <MaterialCommunityIcons name="check" size={14} color={colors.primaryForeground} />
                      ) : (
                        <Text style={[styles.stepNumber, { color: isActive ? BRAND.primary : colors.textSecondary }]}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    {index < arr.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: isCompleted ? BRAND.primary : colors.border }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            <Animated.View
              style={[
                styles.hero,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                },
              ]}
            >
              <View style={[styles.heroIcon, { backgroundColor: `${BRAND.primary}18`, borderColor: `${BRAND.primary}40` }]}>
                <MaterialCommunityIcons name={currentConfig.icon} size={28} color={BRAND.primary} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{currentConfig.title}</Text>
              <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{currentConfig.description}</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {currentStep === 'email' && (
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: errors.email ? colors.error : colors.border }]}>
                    <MaterialCommunityIcons name="email-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="john@example.com"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="email-address"
                      editable={!isLoading}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (text.trim()) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.email ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text> : null}

                  <Text style={[styles.label, { color: colors.textSecondary }]}>Receive OTP via</Text>
                  <View style={styles.deliveryRow}>
                    {(['email', 'sms'] as const).map((method) => (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setDeliveryMethod(method)}
                        style={[
                          styles.deliveryOption,
                          {
                            borderColor: deliveryMethod === method ? BRAND.primary : colors.border,
                            backgroundColor: deliveryMethod === method ? `${BRAND.primary}18` : colors.surface,
                          },
                        ]}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons
                          name={method === 'email' ? 'email-check-outline' : 'message-text-outline'}
                          size={16}
                          color={deliveryMethod === method ? BRAND.primary : colors.textSecondary}
                        />
                        <Text style={[styles.deliveryText, { color: deliveryMethod === method ? BRAND.primary : colors.textPrimary }]}>
                          {method === 'email' ? 'Email' : 'SMS'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity onPress={handleSendOtp} disabled={isLoading} style={styles.buttonWrap} activeOpacity={0.85}>
                    <LinearGradient colors={[BRAND.primary, '#E68200']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Send {deliveryMethod === 'email' ? 'Email' : 'SMS'} OTP</Text>
                          <View style={styles.btnArrowBg}>
                            <MaterialCommunityIcons name="send" size={14} color="#000" />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {currentStep === 'otp' && (
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>One-Time Password</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: errors.otp ? colors.error : colors.border }]}>
                    <MaterialCommunityIcons name="shield-key-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.otpInput, { color: colors.textPrimary }]}
                      placeholder="000000"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isLoading}
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                        if (text.trim()) setErrors((prev) => ({ ...prev, otp: '' }));
                      }}
                    />
                  </View>
                  {errors.otp ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.otp}</Text> : null}

                  <View style={styles.resendContainer}>
                    {resendTimer > 0 ? (
                      <Text style={[styles.resendText, { color: colors.textSecondary }]}>Resend OTP in {resendTimer}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp} disabled={isLoading} style={[styles.resendButton, { backgroundColor: `${BRAND.primary}14` }]}>
                        <MaterialCommunityIcons name="refresh" size={14} color={BRAND.primary} />
                        <Text style={styles.resendLink}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity onPress={handleVerifyOtp} disabled={isLoading} style={styles.buttonWrap} activeOpacity={0.85}>
                    <LinearGradient colors={[BRAND.primary, '#E68200']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Verify OTP</Text>
                          <View style={styles.btnArrowBg}>
                            <MaterialCommunityIcons name="check" size={14} color="#000" />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {currentStep === 'password' && (
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: errors.password ? colors.error : colors.border }]}>
                    <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput, { color: colors.textPrimary }]}
                      placeholder="At least 8 characters"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (text.trim()) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeIcon}>
                      <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text> : null}

                  <View style={[styles.requirementsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {passwordRequirements.map((req) => (
                      <View key={req.text} style={styles.requirement}>
                        <View style={[styles.requirementDot, { backgroundColor: req.met ? COLORS.light.success : colors.border }]} />
                        <Text style={[styles.requirementText, { color: req.met ? COLORS.light.success : colors.textSecondary }]}>{req.text}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: errors.confirmPassword ? colors.error : colors.border }]}>
                    <MaterialCommunityIcons name="lock-check-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput, { color: colors.textPrimary }]}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (text.trim()) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeIcon}>
                      <MaterialCommunityIcons name={showConfirmPassword ? 'eye' : 'eye-off'} size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text> : null}

                  <TouchableOpacity onPress={handleResetPassword} disabled={isLoading} style={styles.buttonWrap} activeOpacity={0.85}>
                    <LinearGradient colors={[BRAND.primary, '#E68200']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Reset Password</Text>
                          <View style={styles.btnArrowBg}>
                            <MaterialCommunityIcons name="check-all" size={14} color="#000" />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login-new')}>
                <Text style={[styles.footerLink, { color: BRAND.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontSize: 13, fontWeight: '800' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8, borderRadius: 1 },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  heroDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  section: { gap: 12 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  otpInput: {
    letterSpacing: 6,
    fontSize: 18,
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeIcon: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  resendLink: {
    color: BRAND.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryOption: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  buttonWrap: {
    marginTop: 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(241, 137, 2, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  buttonGradient: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
  },
  btnArrowBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 18,
  },
  footerText: {
    fontSize: 12,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
