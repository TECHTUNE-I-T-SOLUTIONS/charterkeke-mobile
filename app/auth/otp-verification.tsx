import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/utils/colors';
import { TextInput } from 'react-native';

export default function OTPVerificationScreen() {
  const router = useLocalSearchParams();
  const navigation = useRouter();
  const { verifyOTP, resendOTP, isLoading } = useAuth();
  const [isDark, setIsDark] = useState(false);

  const email = Array.isArray(router.email) ? router.email[0] : router.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Timer for resend
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus to next input if value is entered
    if (value && index < 5) {
      // Reference to next input would be here (would need refs)
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOTP({
        email,
        otp: otpCode,
      });

      if (result.success) {
        // Navigate to profile completion
        navigation.push({
          pathname: '/auth/profile-completion',
          params: { email },
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOTP({ email });
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      console.error('Resend OTP error:', error);
    }
  };

  const colors = isDark ? COLORS.dark : COLORS.light;
  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
              Verify Your Email
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Enter the 6-digit code we sent to{'\n'}
              <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
            </Text>
          </View>

          {/* OTP Input Fields */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                maxLength={1}
                keyboardType="number-pad"
                style={{
                  width: 50,
                  height: 60,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: digit ? colors.primary + '15' : 'transparent',
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: colors.text,
                }}
                editable={!isVerifying}
              />
            ))}
          </View>

          {/* Verify Button */}
          <Button
            title={isVerifying ? 'Verifying...' : 'Verify Code'}
            onPress={handleVerifyOtp}
            disabled={!isOtpComplete || isVerifying}
            isDark={isDark}
            size="large"
          />

          {/* Resend Section */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp}>
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                  Didn't receive the code? Resend
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                Resend code in <Text style={{ fontWeight: '600', color: colors.text }}>{formatTime(timeLeft)}</Text>
              </Text>
            )}
          </View>

          {/* Change Email */}
          <TouchableOpacity
            onPress={() => navigation.back()}
            style={{ marginTop: 16 }}
            disabled={isVerifying}
          >
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600', textAlign: 'center' }}>
              Change Email Address
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
