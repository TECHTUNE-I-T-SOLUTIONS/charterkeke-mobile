import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@utils/colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isDark?: boolean;
}

const getButtonStyles = (
  variant: string,
  size: string,
  isDark: boolean,
  disabled: boolean
) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const variants: Record<string, any> = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: colors.border,
    },
    destructive: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
  };

  const sizes: Record<string, any> = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      minHeight: 32,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      minHeight: 44,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 10,
      minHeight: 56,
    },
  };

  return {
    ...variants[variant],
    ...sizes[size],
    opacity: disabled ? 0.5 : 1,
  };
};

const getTextColor = (variant: string, isDark: boolean) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const textColors: Record<string, string> = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    destructive: '#ffffff',
    outline: colors.primary,
  };

  return textColors[variant] || colors.foreground;
};

const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  isDark = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getButtonStyles(variant, size, isDark, disabled),
        style,
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(variant, isDark),
            fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 18,
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {loading ? '...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});

export default Button;
