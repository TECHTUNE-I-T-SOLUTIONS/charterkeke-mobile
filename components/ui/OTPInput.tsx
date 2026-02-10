import React, { useRef, useEffect } from 'react';
import { View, TextInput, Text } from 'react-native';
import { COLORS } from '@/utils/colors';

interface OTPInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  isDark?: boolean;
}

const OTPInput = ({ length = 6, onComplete, isDark = false }: OTPInputProps) => {
  const inputRefs = useRef<TextInput[]>([]);
  const [otp, setOtp] = React.useState<string[]>(new Array(length).fill(''));

  const colors = isDark ? COLORS.dark : COLORS.light;

  const handleChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next field if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete if all fields are filled
    if (newOtp.every((digit) => digit)) {
      onComplete?.(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={{
              flex: 1,
              height: 60,
              borderWidth: 2,
              borderColor: otp[index] ? colors.primary : colors.border,
              borderRadius: 12,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: '600',
              color: colors.text,
              backgroundColor: colors.background,
            }}
            maxLength={1}
            keyboardType="numeric"
            value={otp[index]}
            onChangeText={(value) => handleChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            placeholderTextColor={colors.textSecondary}
          />
        ))}
    </View>
  );
};

export default OTPInput;
