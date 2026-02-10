import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { COLORS } from '@utils/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  isDark?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({ children, style, isDark = false, pressable, onPress }) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default Card;
