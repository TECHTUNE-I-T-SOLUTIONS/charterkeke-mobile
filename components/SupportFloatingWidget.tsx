import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/context/ThemeContext';

interface SupportFloatingWidgetProps {
  route: string;
  bottom?: number;
}

export default function SupportFloatingWidget({ route, bottom = 110 }: SupportFloatingWidgetProps) {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.wrap, { bottom }]}> 
      <TouchableOpacity
        onPress={() => router.push(route as any)}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          },
        ]}
      >
        <MaterialCommunityIcons name="headset" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
  },
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
});
