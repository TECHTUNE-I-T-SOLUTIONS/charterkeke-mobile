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
    } catch (error) {
      setErrors({ submit: 'Invalid credentials. Please try again.' });
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
    </View>
  );
}

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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: scale(20) },
  footerText: { fontSize: scale(14) },
  footerLink: { fontSize: scale(14), fontWeight: '700' },
});
