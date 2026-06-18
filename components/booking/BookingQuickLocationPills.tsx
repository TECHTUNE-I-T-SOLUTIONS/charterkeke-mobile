import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type RecentLocation = {
  address: string;
  lat: number;
  lng: number;
  timestamp: number;
};

type Props = {
  title: string;
  subtitle?: string;
  currentLocationLabel: string;
  recentLocations: RecentLocation[];
  theme: any;
  styles: any;
  onUseCurrentLocation: () => void;
  onSelectRecentLocation: (location: RecentLocation) => void;
};

export function BookingQuickLocationPills({
  title,
  subtitle,
  currentLocationLabel,
  recentLocations,
  theme,
  styles,
  onUseCurrentLocation,
  onSelectRecentLocation,
}: Props) {
  return (
    <View style={styles.quickLocationSection}>
      <View style={styles.quickLocationHeader}>
        <Text style={[styles.quickLocationTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.quickLocationSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.quickLocationCard, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
        onPress={onUseCurrentLocation}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={18} color={BRAND.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.quickLocationLabel, { color: theme.colors.textPrimary }]}>Current location</Text>
          <Text numberOfLines={1} style={[styles.quickLocationValue, { color: theme.colors.textSecondary }]}>
            {currentLocationLabel}
          </Text>
        </View>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentChipsRow}>
        {recentLocations.map((location) => (
          <TouchableOpacity
            key={`${location.address}-${location.timestamp}`}
            style={[styles.recentChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => onSelectRecentLocation(location)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="map-marker" size={15} color={BRAND.primary} />
            <Text numberOfLines={1} style={[styles.recentChipText, { color: theme.colors.textPrimary }]}>
              {location.address}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
