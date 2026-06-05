// 'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { ThemeToggle } from '@components/ThemeToggle';
import { BRAND } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

// InputField component moved outside to prevent re-creation on every render
const InputField = React.memo(({ 
  label, 
  value, 
  onChangeText, 
  error, 
  icon, 
  secureTextEntry, 
  fieldKey, 
  rightIcon, 
  onRightPress,
  isFocused,
  onFocus,
  onBlur,
  theme,
  placeholder,
  keyboardType
}: any) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: theme.colors.inputBackground,
          borderColor: error ? theme.colors.error : (isFocused ? BRAND.primary : theme.colors.inputBorder),
          borderWidth: isFocused ? 1.5 : 1,
        }
      ]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={20} 
          color={isFocused ? BRAND.primary : theme.colors.textTertiary} 
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          placeholderTextColor={theme.colors.inputPlaceholder}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightIcon}>
            <MaterialCommunityIcons name={rightIcon} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
});

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const { theme } = useTheme();

  const [phone, setPhone] = useState('+234');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'agreement' | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (phone.length < 10) newErrors.phone = 'Enter a valid phone number';
    if (password.length < 6) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      const loggedInUser = await login(phone, password);
      if (loggedInUser?.role === 'driver') router.push('/driver/home');
      else if (loggedInUser?.role === 'rider') router.push('/rider/home');
    } catch (error: any) {
      setErrors({ submit: error?.message || 'Invalid credentials. Please try again.' });
    }
  };

  const handleFocus = useCallback((field: string) => {
    setFocusedInput(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedInput(null);
  }, []);

  const isLight = theme.mode === 'light';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <ThemeToggle top={insets.top + 16} right={20} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Sign in to continue your journey
              </Text>

              <View style={styles.form}>
                <InputField 
                  label="Phone Number (with country code +234)" 
                  value={phone} 
                  onChangeText={setPhone} 
                  icon="phone-outline" 
                  fieldKey="phone"
                  error={errors.phone}
                  isFocused={focusedInput === 'phone'}
                  onFocus={() => handleFocus('phone')}
                  onBlur={handleBlur}
                  theme={theme}
                  placeholder="+234 80 1234 5678"
                  keyboardType="phone-pad"
                />
                
                <InputField 
                  label="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  icon="lock-outline" 
                  secureTextEntry={!showPassword} 
                  fieldKey="password"
                  error={errors.password}
                  isFocused={focusedInput === 'password'}
                  onFocus={() => handleFocus('password')}
                  onBlur={handleBlur}
                  theme={theme}
                  placeholder=""
                  keyboardType="default"
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightPress={() => setShowPassword(!showPassword)}
                />

                <TouchableOpacity 
                  onPress={() => router.push('/auth/reset-password')}
                  style={styles.forgotBtn}
                >
                  <Text style={[styles.forgotText, { color: BRAND.primary }]}>Forgot Password?</Text>
                </TouchableOpacity>

                {errors.submit && (
                  <View style={[styles.errorBanner, { backgroundColor: isLight ? '#FEF2F2' : '#450a0a' }]}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color={theme.colors.error} />
                    <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>{errors.submit}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.loginBtn, { backgroundColor: BRAND.primary, opacity: isLoading ? 0.7 : 1 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.consentWrap}>
                  <Text style={[styles.consentText, { color: theme.colors.textSecondary }]}>
                    By logging in, you agree to our{' '}
                    <Text style={[styles.consentLink, { color: BRAND.primary }]} onPress={() => setLegalModal('terms')}>
                      Terms of Use
                    </Text>
                    ,{' '}
                    <Text style={[styles.consentLink, { color: BRAND.primary }]} onPress={() => setLegalModal('privacy')}>
                      Privacy Policy
                    </Text>
                    {' '}and{' '}
                    <Text style={[styles.consentLink, { color: BRAND.primary }]} onPress={() => setLegalModal('agreement')}>
                      User Agreement
                    </Text>
                    .
                  </Text>
                </View>

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/auth/signup-new')}>
                    <Text style={[styles.footerLink, { color: BRAND.primary }]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={Boolean(legalModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setLegalModal(null)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.legalCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.legalHeader}>
              <View style={[styles.legalIcon, { backgroundColor: isLight ? '#FFF5E5' : '#2A1800' }]}>
                <MaterialCommunityIcons
                  name={legalModal === 'privacy' ? 'shield-lock-outline' : legalModal === 'agreement' ? 'account-check-outline' : 'file-document-outline'}
                  size={22}
                  color={BRAND.primary}
                />
              </View>
              <Text style={[styles.legalTitle, { color: theme.colors.textPrimary }]}>
                {legalModal === 'privacy' ? 'Privacy Policy' : legalModal === 'agreement' ? 'User Agreement' : 'Terms of Use'}
              </Text>
              <TouchableOpacity onPress={() => setLegalModal(null)} style={styles.legalClose}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legalScroll} showsVerticalScrollIndicator={false}>
              {(legalModal === 'privacy' ? PRIVACY_POLICY : legalModal === 'agreement' ? USER_AGREEMENT : TERMS_OF_USE).map((section) => (
                <View key={section.title} style={styles.legalSection}>
                  <Text style={[styles.legalSectionTitle, { color: theme.colors.textPrimary }]}>{section.title}</Text>
                  <Text style={[styles.legalBody, { color: theme.colors.textSecondary }]}>{section.body}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setLegalModal(null)} style={[styles.legalButton, { backgroundColor: BRAND.primary }]}>
              <Text style={styles.legalButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const TERMS_OF_USE = [
  { title: 'Use of Charter Keke', body: 'Charter Keke connects riders with independent drivers for local transportation. You agree to provide accurate account information, use the app lawfully, and avoid fraudulent, abusive, unsafe, or disruptive activity.' },
  { title: 'Bookings and Payments', body: 'Ride fares, platform fees, and payment details are shown before or during booking where available. You are responsible for charges connected to rides you request, including cancellation or payment obligations shown in the app.' },
  { title: 'Safety and Conduct', body: 'Riders and drivers must treat each other respectfully, follow applicable road and transport laws, and avoid carrying prohibited, dangerous, or illegal items. Charter Keke may restrict accounts that create safety, fraud, or policy risks.' },
  { title: 'Service Changes', body: 'Features, prices, coverage areas, and availability may change as we improve the service. We may update these terms, and continued use of the app means you accept the latest version shown in the app.' },
];

const PRIVACY_POLICY = [
  { title: 'Information We Collect', body: 'We collect account details such as name, phone number, profile information, login activity, ride requests, payment references, support messages, device identifiers, and app usage data needed to operate Charter Keke.' },
  { title: 'Location Data', body: 'With your permission, we use location data to set pickup or destination points, show nearby drivers, calculate routes and fares, support ride tracking, improve safety, and investigate support or security issues.' },
  { title: 'How We Use Data', body: 'We use your information to authenticate you, match rides, send notifications, process payments, provide support, prevent fraud, improve app performance, comply with legal obligations, and measure service quality.' },
  { title: 'Sharing and Retention', body: 'We share necessary ride details between riders and drivers and with service providers such as payment, notification, maps, hosting, and support tools. We retain information only as needed for service, legal, security, and accounting purposes.' },
  { title: 'Your Choices', body: 'You can update your profile, control device permissions, manage notifications, request support, and ask us to review or delete eligible account information subject to legal and operational requirements.' },
];

const USER_AGREEMENT = [
  { title: 'Consent to Digital Services', body: 'By logging in, you consent to receive ride, safety, support, account, payment, and operational messages through the app, push notifications, SMS, phone, or email where applicable.' },
  { title: 'Accuracy and Responsibility', body: 'You agree that pickup and destination details, phone number, payment method, and account information you provide are accurate. You are responsible for activity under your account unless you promptly report unauthorized access.' },
  { title: 'Location and Matching Consent', body: 'You allow Charter Keke to use selected and permitted location information to match rides, display routes, calculate estimates, provide driver/rider context, and improve transport coverage.' },
  { title: 'Disputes and Support', body: 'If a ride, payment, safety, or account issue occurs, you agree to contact support with accurate details so the team can investigate and resolve the matter fairly.' },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: scale(24) },
  backBtn: { marginBottom: scale(32) },
  title: { fontSize: scale(32), fontWeight: '800', marginBottom: scale(8) },
  subtitle: { fontSize: scale(16), marginBottom: scale(40) },
  form: { gap: scale(20) },
  inputGroup: { gap: scale(8) },
  label: { fontSize: scale(14), fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    height: scale(54),
  },
  inputIcon: { marginRight: scale(10) },
  input: { flex: 1, fontSize: scale(16), height: '100%' },
  rightIcon: { padding: scale(8) },
  errorText: { fontSize: scale(12), marginTop: scale(4) },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: scale(14), fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(8),
    gap: scale(8),
  },
  errorBannerText: { fontSize: scale(14) },
  loginBtn: {
    height: scale(56),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(10),
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnText: { color: '#000000', fontSize: scale(16), fontWeight: '700' },
  consentWrap: { marginTop: scale(2), paddingHorizontal: scale(4) },
  consentText: { fontSize: scale(12), lineHeight: scale(18), textAlign: 'center' },
  consentLink: { fontWeight: '800', textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: scale(20) },
  footerText: { fontSize: scale(14) },
  footerLink: { fontSize: scale(14), fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  legalCard: {
    width: '100%',
    maxHeight: '82%',
    borderRadius: scale(22),
    padding: scale(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  legalHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(10), marginBottom: scale(14) },
  legalIcon: { width: scale(42), height: scale(42), borderRadius: scale(14), alignItems: 'center', justifyContent: 'center' },
  legalTitle: { flex: 1, fontSize: scale(18), fontWeight: '800' },
  legalClose: { width: scale(36), height: scale(36), alignItems: 'center', justifyContent: 'center' },
  legalScroll: { maxHeight: scale(430) },
  legalSection: { marginBottom: scale(16) },
  legalSectionTitle: { fontSize: scale(14), fontWeight: '800', marginBottom: scale(6) },
  legalBody: { fontSize: scale(13), lineHeight: scale(20) },
  legalButton: {
    height: scale(50),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(8),
  },
  legalButtonText: { color: '#000000', fontSize: scale(15), fontWeight: '800' },
});
