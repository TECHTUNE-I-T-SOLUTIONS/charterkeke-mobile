import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
  useColorScheme,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';
import { COLORS } from '@/utils/colors';
import { TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { cacheService } from '@/services/cache';
import { STORAGE_KEYS } from '@/utils/constants';
import { AdVideoManager } from '@/components/AdVideoManager';

type VerificationMethod = 'otp' | 'biometric' | 'password';

interface BiometricInfo {
  available: boolean;
  compatible: string[];
  enrolled: boolean;
}

interface ProfileData {
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  email?: string;
}

export default function ResumeSessionScreen() {
  const router = useLocalSearchParams();
  const navigation = useRouter();
  const { user, isLoading: authLoading, userRole } = useAuth();
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // Ad display state - show once per session resumption
  const [showAdOnMount, setShowAdOnMount] = useState(true);
  const [adDismissed, setAdDismissed] = useState(false);

  // Get user email from params or stored session
  const email = Array.isArray(router.email) ? router.email[0] : router.email || '';

  // Profile picture and user info states
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Verification method states
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // OTP states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpRequested, setOtpRequested] = useState(false); // Track if user requested OTP
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // OTP input refs for auto-focus
  const otpInputRefs = useRef<any[]>([]);

  // Password states
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Biometric states
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    available: false,
    compatible: [],
    enrolled: false,
  });
  const [biometricError, setBiometricError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  // Load cached profile picture on mount
  useEffect(() => {
    const loadCachedProfile = async () => {
      try {
        const cachedProfile = await cacheService.get<ProfileData>(STORAGE_KEYS.RIDER_PROFILE);
        if (cachedProfile) {
          setProfileData(cachedProfile);
          if (cachedProfile.profile_picture_url) {
            setProfilePictureUrl(cachedProfile.profile_picture_url);
          }
          if (cachedProfile.first_name) {
            const fullName = `${cachedProfile.first_name}${cachedProfile.last_name ? ' ' + cachedProfile.last_name : ''}`;
            setUserName(fullName);
          }
        }
      } catch (error) {
        console.error('[ResumeSession] Error loading cached profile:', error);
      }
    };
    loadCachedProfile();
  }, []);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        await authService.initialize();
        if (authService.isTokenExpired()) {
          setSessionExpired(true);
          await AsyncStorage.removeItem('sessionResumed');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [
              {
                text: 'Log In',
                onPress: async () => {
                  await authService.logout().catch(() => {});
                  navigation.replace('/auth/login-new');
                },
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error('[ResumeSession] Session validity check failed:', error);
      }
    };

    verifySession();
  }, [navigation]);

  // Reset OTP state when changing methods
  useEffect(() => {
    if (selectedMethod !== 'otp') {
      setOtpRequested(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setCanResend(false);
      setTimeLeft(600); // Reset to 10 minutes
    }
  }, [selectedMethod]);

  // Timer for OTP resend
  useEffect(() => {
    if (selectedMethod !== 'otp' || timeLeft <= 0) {
      if (timeLeft <= 0) {
        setCanResend(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, selectedMethod]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      console.log('🔐 [BIOMETRIC] Hardware available:', compatible, 'Enrolled:', enrolled);

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const typeStrings = types.map((t) => t.toString());
        const biometricType = typeStrings.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION.toString())
          ? 'Face ID'
          : typeStrings.includes(LocalAuthentication.AuthenticationType.FINGERPRINT.toString())
          ? 'Fingerprint'
          : 'Biometric';
        
        console.log(`✅ [BIOMETRIC] ${biometricType} available and enrolled`);
        
        setBiometricInfo({
          available: true,
          compatible: typeStrings,
          enrolled: true,
        });
      } else {
        console.log('⚠️  [BIOMETRIC] Not available or not enrolled on this device');
      }
    } catch (error) {
      console.error('❌ [BIOMETRIC] Check error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const requestOTP = async () => {
    try {
      const userEmail = email || (user && 'email' in user ? user.email : '');
      if (!userEmail) {
        setOtpError('Unable to determine email address');
        return;
      }

      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.vercel.app/api';
      console.log('[ResumeSession] Requesting OTP from:', `${API_BASE}/otp/request`, 'for email:', userEmail);

      const response = await fetch(`${API_BASE}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail,
          type: 'resume_session' 
        }),
      });

      console.log('[ResumeSession] OTP request response status:', response.status);

      // Clone response to check content type first
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[ResumeSession] Failed to parse response as JSON:', parseError);
          setOtpError('Server returned invalid data. Please try again.');
          return;
        }
      } else {
        // Not JSON - likely HTML error page (404, 500, etc)
        console.error('[ResumeSession] Response is not JSON, status:', response.status);
        setOtpError(`Server error (${response.status}). Please check your connection.`);
        return;
      }

      if (!response.ok) {
        setOtpError(data?.message || data?.error || 'Failed to send OTP');
        console.error('[ResumeSession] OTP request failed:', data);
        return;
      }

      console.log('[ResumeSession] OTP sent successfully');
      setOtpRequested(true);
      setTimeLeft(600); // Reset timer to 10 minutes
      setCanResend(false);
      setOtpRequested(true);
      setTimeLeft(600); // Reset timer to 10 minutes
      setCanResend(false);
    } catch (error: any) {
      console.error('Request OTP error:', error?.message || error);
      setOtpError(`Failed to send OTP: ${error?.message || 'Network error'}`);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // If pasted multiple digits, distribute them
      const newOtp = [...otp];
      for (let i = 0; i < numericValue.length && index + i < 6; i++) {
        newOtp[index + i] = numericValue[i];
      }
      setOtp(newOtp);
      
      // Focus on the last filled input or the next empty one
      const nextIndex = Math.min(index + numericValue.length - 1, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto-focus to next input if a digit was entered
      if (numericValue && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    // Handle backspace to go to previous input
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (sessionExpired || authService.isTokenExpired()) {
      setOtpError('Your session has expired. Please log in again.');
      await handleLogout();
      return;
    }
    setOtpError('');
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      const userEmail = email || (user && 'email' in user ? user.email : '');
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.vercel.app/api';
      const response = await fetch(`${API_BASE}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: otpCode,
          type: 'resume_session',
        }),
      });

      // Check content type first to avoid double reading
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[ResumeSession] Failed to parse verify response:', parseError);
          setOtpError('Server error. Please try again.');
          return;
        }
      } else {
        console.error('[ResumeSession] Response is not JSON, status:', response.status);
        setOtpError(`Server error (${response.status}). Please try again.`);
        return;
      }

      if (response.ok && data.success) {
        // Resume session successfully
        const nextRole = userRole || (authService.getUserRole() as any);
        if (!nextRole) {
          setOtpError('We could not verify your account role. Please log in again.');
          await handleLogout();
          return;
        }

        await AsyncStorage.setItem('sessionResumed', 'true');
        
        if (sessionExpired || authService.isTokenExpired()) {
          setOtpError('Your session has expired. Please log in again.');
          await handleLogout();
          return;
        }

        if (nextRole === 'driver') {
          navigation.replace('/driver/home');
        } else if (nextRole === 'rider' || nextRole === 'user') {
          navigation.replace('/rider/home');
        } else {
          await handleLogout();
        }
      } else {
        setOtpError(data?.error || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setOtpError(`Verification failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setOtpError('');
      await requestOTP();
      setTimeLeft(600); // 10 minutes
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Success', 'A new code has been sent via SMS');
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpError('Failed to resend OTP. Please try again.');
    }
  };

  const handleVerifyPassword = async () => {
    if (sessionExpired || authService.isTokenExpired()) {
      setPasswordError('Your session has expired. Please log in again.');
      await handleLogout();
      return;
    }
    setPasswordError('');

    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    try {
      const userEmail = email || (user && 'email' in user ? user.email : '');
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://charterkeke.vercel.app/api';
      const response = await fetch(`${API_BASE}/auth/verify-session-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password,
        }),
      });

      // Check content type first to avoid double reading
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[ResumeSession] Failed to parse password verify response:', parseError);
          setPasswordError('Server error. Please try again.');
          return;
        }
      } else {
        console.error('[ResumeSession] Response is not JSON, status:', response.status);
        setPasswordError(`Server error (${response.status}). Please try again.`);
        return;
      }

      if (response.ok && data.verified) {
        const nextRole = userRole || (authService.getUserRole() as any);
        if (!nextRole) {
          setPasswordError('We could not verify your account role. Please log in again.');
          await handleLogout();
          return;
        }

        await AsyncStorage.setItem('sessionResumed', 'true');
        
        if (sessionExpired || authService.isTokenExpired()) {
          setPasswordError('Your session has expired. Please log in again.');
          await handleLogout();
          return;
        }

        if (nextRole === 'driver') {
          navigation.replace('/driver/home');
        } else if (nextRole === 'rider' || nextRole === 'user') {
          navigation.replace('/rider/home');
        } else {
          await handleLogout();
        }
      } else {
        setPasswordError(data?.message || 'Invalid password. Please try again.');
      }
    } catch (error: any) {
      console.error('Password verification error:', error);
      setPasswordError(`Verification failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBiometricVerification = async () => {
    setBiometricError('');

    if (!biometricInfo.available || !biometricInfo.enrolled) {
      setBiometricError('Biometric authentication not available');
      return;
    }

    if (sessionExpired || authService.isTokenExpired()) {
      setBiometricError('Your session has expired. Please log in again.');
      Alert.alert(
        'Session Expired',
        'For your security, your login session has expired. Please sign in again to continue.',
        [{ text: 'Log In', onPress: handleLogout }],
        { cancelable: false }
      );
      return;
    }

    setIsVerifying(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        const nextRole = userRole || (authService.getUserRole() as any);
        if (!nextRole) {
          setBiometricError('We could not verify your account role. Please log in again.');
          await handleLogout();
          return;
        }
        console.log('✅ [BIOMETRIC] Verification successful, navigating to dashboard');
        await AsyncStorage.setItem('sessionResumed', 'true');
        
        // Route based on user role
        if (nextRole === 'driver') {
          console.log('🚗 [ROUTING] Verified via biometric, routing to /driver/home');
          navigation.replace('/driver/home');
        } else if (nextRole === 'rider' || nextRole === 'user') {
          console.log('👤 [ROUTING] Verified via biometric, routing to /rider/home');
          navigation.replace('/rider/home');
        } else {
          console.log('Unknown role after biometric verification, logging out');
          await handleLogout();
        }
      } else if (result.error !== 'user_cancel') {
        console.log('❌ [BIOMETRIC] Verification failed:', result.error);
        setBiometricError('Biometric verification failed. Please try again.');
      } else {
        console.log('⚠️  [BIOMETRIC] User cancelled biometric prompt');
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      setBiometricError('Biometric authentication error. Please try another method.');
    } finally {
      setIsVerifying(false);
    }
  };

  const colors = isDark ? COLORS.dark : COLORS.light;
  const isOtpComplete = otp.every((digit) => digit !== '');

  // Determine biometric type for display
  const getBiometricType = () => {
    if (!biometricInfo.available) return 'Biometric';
    if (biometricInfo.compatible.includes('facial')) {
      return 'Face ID';
    }
    if (biometricInfo.compatible.includes('fingerprint')) {
      return 'Fingerprint';
    }
    return 'Biometric';
  };

  // Handle ad dismissal - called when user skips the promotional ad
  const handleAdSkipped = () => {
    console.log('[ResumeSession] User skipped promotional ad, showing verification methods');
    setAdDismissed(true);
  };

  // Handle logout - clear session and navigate to login
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('sessionResumed');
      await AsyncStorage.removeItem('userSession');
      await authService.logout().catch(() => {});
      setSessionExpired(true);
      navigation.replace('/auth/login-new');
    } catch (error) {
      console.error('[ResumeSession] Error during logout:', error);
      // Still navigate even if cleanup fails
      navigation.replace('/auth/login-new');
    }
  };

  const renderOtpVerification = () => (
    <View>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
        Verify via SMS Code
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
        {otpRequested ? 'Enter the 6-digit code sent to your phone' : 'Request a verification code via SMS'}
      </Text>

      {!otpRequested ? (
        <>
          {otpError ? (
            <Text style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 16 }}>{otpError}</Text>
          ) : null}
          <Button
            title={isVerifying ? 'Sending...' : '📱 Send SMS Code'}
            onPress={requestOTP}
            disabled={isVerifying}
            isDark={isDark}
            size="large"
          />
        </>
      ) : (
        <>
          {/* OTP Input Fields */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 }}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) otpInputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                maxLength={1}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: digit ? colors.primary + '10' : colors.inputBackground || colors.background,
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: colors.text,
                }}
                editable={!isVerifying}
              />
            ))}
          </View>

          {otpError ? (
            <Text style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 16 }}>{otpError}</Text>
          ) : null}

          {/* Verify Button */}
          <Button
            title={isVerifying ? 'Verifying...' : 'Verify Code'}
            onPress={handleVerifyOtp}
            disabled={!isOtpComplete || isVerifying}
            isDark={isDark}
            size="large"
          />

          {/* Resend Section */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={isVerifying}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                  Didn't receive the code? Resend
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Resend code in{' '}
                <Text style={{ fontWeight: '600', color: colors.text }}>
                  {formatTime(timeLeft)}
                </Text>
              </Text>
            )}
          </View>

          {/* SMS Delivery Notice */}
          <View style={{ marginTop: 20, backgroundColor: colors.primary + '10', borderLeftWidth: 4, borderLeftColor: colors.primary, padding: 12, borderRadius: 6 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
              💡 <Text style={{ fontWeight: '600', color: colors.text }}>Note:</Text> If the SMS didn't deliver, it could be due to temporary service provider delays or network issues. Please check your spam folder or try resending once the timer expires.
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderPasswordVerification = () => (
    <View>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
        Enter Your Password
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
        Confirm your password to continue
      </Text>

      {/* Password Input */}
      <View
        style={{
          borderRadius: 10,
          borderWidth: 2,
          borderColor: passwordError ? '#FF6B6B' : colors.border,
          backgroundColor: colors.inputBackground || colors.background,
          paddingHorizontal: 12,
          marginBottom: passwordError ? 8 : 24,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showPassword}
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 14,
            color: colors.text,
          }}
          editable={!isVerifying}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isVerifying}>
          <Text style={{ color: colors.primary, marginRight: 8, fontWeight: '600' }}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      {passwordError ? (
        <Text style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 16 }}>{passwordError}</Text>
      ) : null}

      {/* Verify Button */}
      <Button
        title={isVerifying ? 'Verifying...' : 'Verify Password'}
        onPress={handleVerifyPassword}
        disabled={!password || isVerifying}
        isDark={isDark}
        size="large"
      />

      {/* Logout Button - Replace password with a new account */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            'Log Out',
            'Sign out of this account and log in with a different one?',
            [
              { text: 'Cancel', onPress: () => {} },
              {
                text: 'Log Out',
                onPress: handleLogout,
                style: 'destructive',
              },
            ]
          );
        }}
        style={{ marginTop: 16 }}
        disabled={isVerifying}
      >
        <Text style={{ fontSize: 13, color: '#FF6B6B', fontWeight: '600', textAlign: 'center' }}>
          Use a Different Account
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBiometricVerification = () => (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
        Verify with {getBiometricType()}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 32, textAlign: 'center' }}>
        Use your {getBiometricType().toLowerCase()} to verify your identity
      </Text>

      {/* Biometric Icon/Button */}
      <TouchableOpacity
        onPress={handleBiometricVerification}
        disabled={isVerifying || !biometricInfo.available}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.primary + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        {isVerifying ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <Text style={{ fontSize: 40 }}>
            {getBiometricType() === 'Face ID' ? '😊' : '👆'}
          </Text>
        )}
      </TouchableOpacity>

      {biometricError ? (
        <Text style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
          {biometricError}
        </Text>
      ) : null}

      {/* Button for manual trigger */}
      <Button
        title={isVerifying ? 'Verifying...' : `Verify with ${getBiometricType()}`}
        onPress={handleBiometricVerification}
        disabled={isVerifying || !biometricInfo.available}
        isDark={isDark}
        size="large"
      />
    </View>
  );

  const renderMethodSelection = () => (
    <View>
      {/* Header Text */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
          Welcome Back! 👋
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          Choose how to verify your identity
        </Text>
      </View>

      {/* Verification Method Cards */}
      <View style={{ gap: 12, marginBottom: 24 }}>
        {/* Biometric Option - Show First if Available */}
        {biometricInfo.available && (
          <TouchableOpacity
            onPress={() => {
              console.log('👆 [RESUME-SESSION] User selected', getBiometricType());
              setSelectedMethod('biometric');
            }}
            style={{
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selectedMethod === 'biometric' ? colors.primary : colors.primary + '40',
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: selectedMethod === 'biometric' ? colors.primary + '15' : colors.primary + '08',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderStyle: 'solid',
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 6 }}>
                  {getBiometricType() === 'Face ID' ? '👤' : '👆'} {getBiometricType()}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', backgroundColor: colors.primary, color: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  FASTEST
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Fastest way to verify your identity
              </Text>
            </View>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedMethod === 'biometric' ? colors.primary : colors.primary + '40',
                backgroundColor: selectedMethod === 'biometric' ? colors.primary : 'transparent',
                marginLeft: 12,
              }}
            />
          </TouchableOpacity>
        )}
        
        {/* OTP Option */}
        <TouchableOpacity
          onPress={() => setSelectedMethod('otp')}
          style={{
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selectedMethod === 'otp' ? colors.primary : colors.border,
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: selectedMethod === 'otp' ? colors.primary + '15' : colors.card || colors.background,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
              📱 SMS Code
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Get a 6-digit code via SMS
            </Text>
          </View>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selectedMethod === 'otp' ? colors.primary : colors.border,
              backgroundColor: selectedMethod === 'otp' ? colors.primary : 'transparent',
              marginLeft: 12,
            }}
          />
        </TouchableOpacity>

        {/* Password Option */}
        <TouchableOpacity
          onPress={() => setSelectedMethod('password')}
          style={{
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selectedMethod === 'password' ? colors.primary : colors.border,
            paddingVertical: 16,
            paddingHorizontal: 16,
            backgroundColor: selectedMethod === 'password' ? colors.primary + '15' : colors.card || colors.background,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
              🔐 Password
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Enter your password to continue
            </Text>
          </View>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selectedMethod === 'password' ? colors.primary : colors.border,
              backgroundColor: selectedMethod === 'password' ? colors.primary : 'transparent',
              marginLeft: 12,
            }}
          />
        </TouchableOpacity>


      </View>

      {/* Logout Option */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            'Log Out',
            'Are you sure you want to log out? You\'ll need to log in again.',
            [
              { text: 'Cancel', onPress: () => {} },
              {
                text: 'Log Out',
                onPress: async () => {
                  await AsyncStorage.removeItem('sessionResumed');
                  navigation.replace('/auth/login-new');
                },
                style: 'destructive',
              },
            ]
          );
        }}
        style={{ alignItems: 'center' }}
      >
        <Text style={{ fontSize: 14, color: '#FF6B6B', fontWeight: '600' }}>
          Use a Different Account
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (sessionExpired) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <View style={{
            borderRadius: 24,
            padding: 24,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 16,
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: `${colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MaterialCommunityIcons name="account-clock-outline" size={32} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Session expired</Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textSecondary }}>
              For your security, you need to sign in again to continue.
            </Text>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                marginTop: 8,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: '800', fontSize: 15 }}>
                Sign in again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingVertical: 20,
            justifyContent: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Theme Toggle */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            marginHorizontal: -20,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
            {selectedMethod && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedMethod(null);
                  setOtp(['', '', '', '', '', '']);
                  setPassword('');
                  setOtpError('');
                  setPasswordError('');
                  setBiometricError('');
                }}
                style={{ marginRight: 12 }}
                disabled={isVerifying}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {/* Theme Toggle Button */}
            <TouchableOpacity
              onPress={() => setIsDark(!isDark)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {isDark ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Picture and User Info - Show when no method selected */}
          {!selectedMethod && profilePictureUrl && (
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              {/* Profile Picture Avatar */}
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: colors.primary + '40',
              }}>
                <Image
                  source={{ uri: profilePictureUrl }}
                  style={{ width: '100%', height: '100%' }}
                  onError={(error) => {
                    console.error('[ResumeSession] Error loading profile picture:', error);
                    setProfilePictureUrl(null);
                  }}
                />
              </View>
              
              {/* User Name */}
              {userName && (
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                  {userName}
                </Text>
              )}
              
              {/* Email */}
              {email && (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {email}
                </Text>
              )}
            </View>
          )}

          {/* Render appropriate content */}
          {!selectedMethod && renderMethodSelection()}
          {selectedMethod === 'otp' && renderOtpVerification()}
          {selectedMethod === 'password' && renderPasswordVerification()}
          {selectedMethod === 'biometric' && renderBiometricVerification()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Promotional Ad - Shows only once on first mount, before verification methods */}
      {showAdOnMount && !adDismissed && (
        <AdVideoManager
          visible={true}
          onClose={handleAdSkipped}
          onNavigateToBooking={handleAdSkipped}
        />
      )}
    </SafeAreaView>
  );
}
