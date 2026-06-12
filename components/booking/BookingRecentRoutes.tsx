import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type Location = {
  lat: number;
  lng: number;
  address: string;
};

export type BookingRecentRoute = {
  pickup: Location;
  dropoff: Location;
  distanceKm: number;
  durationMinutes: number;
  fare: number;
  timestamp: number;
};

type Props = {
  routes: BookingRecentRoute[];
  theme: any;
  styles: any;
  sanitizeAddress: (address: string) => string;
  onSelect: (route: BookingRecentRoute) => void;
};

export function BookingRecentRoutes({ routes, theme, styles, sanitizeAddress, onSelect }: Props) {
  if (!routes.length) return null;

  return (
    <View style={styles.recentRoutesWrap}>
      <Text style={[styles.recentRoutesTitle, { color: theme.colors.textSecondary }]}>Recent routes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRoutesList}>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={`${route.pickup.address}-${route.dropoff.address}-${index}`}
            style={[styles.recentRouteCard, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
            activeOpacity={0.86}
            onPress={() => onSelect(route)}
          >
            <MaterialCommunityIcons name="routes" size={18} color={BRAND.primary} />
            <Text numberOfLines={1} style={[styles.recentRouteMain, { color: theme.colors.textPrimary }]}>
              {sanitizeAddress(route.dropoff.address)}
            </Text>
            <Text numberOfLines={1} style={[styles.recentRouteSub, { color: theme.colors.textSecondary }]}>
              From {sanitizeAddress(route.pickup.address)}
            </Text>
            <Text style={[styles.recentRouteFare, { color: BRAND.primary }]}>N{route.fare.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
