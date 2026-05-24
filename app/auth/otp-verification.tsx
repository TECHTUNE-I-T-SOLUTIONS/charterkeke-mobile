import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { COLORS, BRAND } from '@/utils/colors';

export default function OTPVerificationScreen() {
  const router = useLocalSearchParams();
  const navigation = useRouter();
  const { verifyOTP, resendOTP } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = isDark ? COLORS.dark : COLORS.light;
  const email = Array.isArray(router.email) ? router.email[0] : router.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const isOtpComplete = useMemo(() => otp.every(Boolean), [otp]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    const numeric = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = numeric;
    setOtp(next);
    setError('');
    if (numeric && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOTP({ email, otp: code });
      if (result.success) {
        navigation.push({
          pathname: '/auth/profile-completion',
          params: { email },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'We could not verify that code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(email);
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Unable to resend code right now.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.shell}>
          <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${BRAND.primary}18` }]}>
              <MaterialCommunityIcons name="shield-key-outline" size={28} color={BRAND.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to
              {'\n'}
              <Text style={{ color: colors.text, fontWeight: '700' }}>{email}</Text>
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Verification code</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  maxLength={1}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  selectionColor={BRAND.primary}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: digit ? BRAND.primary : colors.border,
                      color: colors.text,
                    },
                  ]}
                  editable={!isVerifying}
                />
              ))}
            </View>

            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            <Button
              title={isVerifying ? 'Verifying...' : 'Verify code'}
              onPress={handleVerifyOtp}
              disabled={!isOtpComplete || isVerifying}
              isDark={isDark}
              size="large"
            />

            <View style={styles.resendWrap}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={isVerifying}>
                  <Text style={[styles.link, { color: BRAND.primary }]}>Resend code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.helper, { color: colors.textSecondary }]}>
                  Resend available in <Text style={{ color: colors.text, fontWeight: '700' }}>{formatTime(timeLeft)}</Text>
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => navigation.back()} disabled={isVerifying}>
              <Text style={[styles.secondaryLink, { color: colors.textSecondary }]}>
                Change email address
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  shell: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  otpBox: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  error: { fontSize: 13, fontWeight: '600' },
  resendWrap: { alignItems: 'center', marginTop: 4 },
  helper: { fontSize: 13, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '700' },
  secondaryLink: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
