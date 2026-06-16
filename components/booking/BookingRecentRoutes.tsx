import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
  pickupTime?: string | null;
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
      <Text style={[styles.recentRoutesTitle, { color: theme.colors.textPrimary }]}>Quick Booking</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRoutesList}>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={`${route.pickup.address}-${route.dropoff.address}-${index}`}
            style={[styles.recentRouteCard, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
            activeOpacity={0.86}
            onPress={() => onSelect(route)}
          >
            <View style={styles.recentRouteIconBadge}>
              <Image source={require('@assets/charter keke.png')} style={styles.recentRouteIconBadge} resizeMode="contain" />
            </View>
            <Text numberOfLines={2} style={[styles.recentRouteMain, { color: theme.colors.textPrimary }]}>
              {sanitizeAddress(route.dropoff.address)}
            </Text>
            <Text numberOfLines={1} style={[styles.recentRouteSub, { color: theme.colors.textSecondary }]}>
              From {sanitizeAddress(route.pickup.address)}
            </Text>
            <Text numberOfLines={1} style={[styles.recentRouteSub, { color: theme.colors.textSecondary }]}>
              To {sanitizeAddress(route.dropoff.address)}
            </Text>
            <Text numberOfLines={1} style={[styles.recentRouteDistance, { color: theme.colors.textSecondary }]}>
              When: Choose time
            </Text>
            <View style={styles.recentRouteMetaRow}>
              <Text style={[styles.recentRouteFare, { color: BRAND.primary }]}>N{route.fare.toLocaleString()}</Text>
              <Text numberOfLines={1} style={[styles.recentRouteTime, { color: theme.colors.textSecondary }]}>
                Book again
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
