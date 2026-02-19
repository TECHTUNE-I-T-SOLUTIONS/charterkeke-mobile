import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface MapPlaceholderProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  children?: React.ReactNode;
  style?: any;
}

export const MapPlaceholder = React.forwardRef<any, MapPlaceholderProps>(
  ({ style }, ref) => {
    const { theme } = useTheme();

    return (
      <View
        style={[
          styles.container,
          style,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <MaterialCommunityIcons name="map-outline" size={48} color={theme.colors.textTertiary} />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          📍 Map Preview
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Build a development build to see maps
        </Text>
        <Text style={[styles.command, { color: theme.colors.textTertiary }]}>
          pnpm expo run:android
        </Text>
      </View>
    );
  }
);

MapPlaceholder.displayName = 'MapPlaceholder';

export const MarkerPlaceholder: React.FC<any> = () => null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  command: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#00000010',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
