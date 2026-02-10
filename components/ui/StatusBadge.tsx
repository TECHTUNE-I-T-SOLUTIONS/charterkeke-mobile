import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/utils/colors';

interface StatusBadgeProps {
  status: 'active' | 'completed' | 'cancelled' | 'pending' | 'failed' | 'verified';
  isDark?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge = ({
  status,
  isDark = false,
  size = 'medium',
}: StatusBadgeProps) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: colors.success + '20',
          textColor: colors.success,
          icon: '●',
          label: 'Active',
        };
      case 'completed':
        return {
          backgroundColor: colors.success + '20',
          textColor: colors.success,
          icon: '✓',
          label: 'Completed',
        };
      case 'cancelled':
        return {
          backgroundColor: colors.error + '20',
          textColor: colors.error,
          icon: '✕',
          label: 'Cancelled',
        };
      case 'pending':
        return {
          backgroundColor: colors.warning + '20',
          textColor: colors.warning,
          icon: '⏳',
          label: 'Pending',
        };
      case 'failed':
        return {
          backgroundColor: colors.error + '20',
          textColor: colors.error,
          icon: '✕',
          label: 'Failed',
        };
      case 'verified':
        return {
          backgroundColor: colors.success + '20',
          textColor: colors.success,
          icon: '✓',
          label: 'Verified',
        };
      default:
        return {
          backgroundColor: colors.border + '20',
          textColor: colors.textSecondary,
          icon: '●',
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
        };
      case 'medium':
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: config.backgroundColor,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
        borderRadius: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          marginRight: 4,
          fontSize: size === 'small' ? 8 : size === 'large' ? 12 : 10,
          color: config.textColor,
        }}
      >
        {config.icon}
      </Text>
      <Text
        style={{
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
          color: config.textColor,
          textTransform: 'capitalize',
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;
