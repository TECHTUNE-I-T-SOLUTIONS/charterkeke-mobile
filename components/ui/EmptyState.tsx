import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/utils/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  isDark?: boolean;
}

const EmptyState = ({
  icon = '📭',
  title,
  description,
  actionTitle,
  onAction,
  isDark = false,
}: EmptyStateProps) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
      }}
    >
      <Text style={{ fontSize: 64, marginBottom: 16 }}>{icon}</Text>

      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      )}

      {actionTitle && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{
            marginTop: 8,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff',
            }}
          >
            {actionTitle}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
