import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

interface ThemeToggleProps {
  position?: 'absolute' | 'relative';
  top?: number;
  right?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  position = 'absolute',
  top = 16,
  right = 16,
}) => {
  const { mode, toggleTheme, theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          position,
          top,
          right,
        },
      ]}
    >
      <TouchableOpacity
        onPress={toggleTheme}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surfaceLight,
            borderColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={mode === 'light' ? 'moon-waning-crescent' : 'white-balance-sunny'}
          size={24}
          color={theme.colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
