import React, { useState, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { COLORS } from '@/utils/colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

const Toast = ({
  visible = false,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) => {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.light.success;
      case 'error':
        return COLORS.light.error;
      case 'warning':
        return COLORS.light.warning;
      case 'info':
        return COLORS.light.primary;
      default:
        return COLORS.light.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        opacity,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: getBackgroundColor(),
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            marginRight: 12,
            color: '#ffffff',
          }}
        >
          {getIcon()}
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: '500',
            color: '#ffffff',
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

export default Toast;
