import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type Props = {
  theme: any;
  styles: any;
  isLight: boolean;
  routeLoading: boolean;
  estimatedDistance: number;
  estimatedDuration: number;
  bookingTotalFare: number;
  baseFare: number;
  weatherLabel: string;
  weatherDetail: string;
  weatherSurcharge: number;
  trafficLabel: string;
  bookingPlatformFee: number;
  bookingEstimatedDriverFare: number;
};

export function BookingFareSummary({
  theme,
  styles,
  isLight,
  routeLoading,
  estimatedDistance,
  estimatedDuration,
  bookingTotalFare,
  baseFare,
  weatherLabel,
  weatherDetail,
  weatherSurcharge,
  trafficLabel,
  bookingPlatformFee,
  bookingEstimatedDriverFare,
}: Props) {
  return (
    <View style={[styles.simpleFareCard, { backgroundColor: isLight ? '#FFF7EA' : '#281A05', borderColor: BRAND.primary }]}>
      <View style={styles.simpleFareTop}>
        <View>
          <Text style={[styles.simpleFareLabel, { color: theme.colors.textSecondary }]}>
            {routeLoading ? 'Calculating route...' : 'Estimated fare'}
          </Text>
          <Text style={[styles.simpleFareValue, { color: BRAND.primary }]}>N{bookingTotalFare.toLocaleString()}</Text>
        </View>
        <View style={styles.simpleFareBadge}>
          <MaterialCommunityIcons name="cash-multiple" size={16} color={BRAND.primary} />
          <Text style={[styles.simpleFareBadgeText, { color: theme.colors.textPrimary }]}>{estimatedDistance || 0} km</Text>
        </View>
      </View>
      <View style={styles.simpleFareMeta}>
        <Text style={[styles.simpleFareMetaText, { color: theme.colors.textSecondary }]}>
          {estimatedDuration > 0 ? `${estimatedDuration} min` : 'ETA pending'}
        </Text>
        {/* <Text style={[styles.simpleFareMetaText, { color: theme.colors.textSecondary }]}>
          Platform fee N{bookingPlatformFee.toLocaleString()} | Driver N{bookingEstimatedDriverFare.toLocaleString()}
        </Text> */}
      </View>
      <View style={[styles.compactFareBreakdown, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.simpleFareMetaText, { color: theme.colors.textPrimary }]}>
          Kindly pay the driver directly. Arrival time may vary with traffic.
        </Text>
        <View style={styles.simpleFareRow}>
          <Text style={[styles.simpleFareMetaText, { color: theme.colors.textSecondary }]}>Base fare</Text>
          <Text style={[styles.simpleFareMetaText, { color: theme.colors.textPrimary }]}>N{baseFare.toLocaleString()}</Text>
        </View>
        <View style={styles.simpleFareRow}>
          <Text style={[styles.simpleFareMetaText, { color: theme.colors.textSecondary }]}>{weatherLabel}</Text>
          <Text style={[styles.simpleFareMetaText, { color: weatherSurcharge > 0 ? '#E88B00' : theme.colors.textPrimary }]}>
            {weatherSurcharge > 0 ? `+N${weatherSurcharge.toLocaleString()}` : 'N0'}
          </Text>
        </View>
        <View style={styles.simpleFareRow}>
          <Text style={[styles.simpleFareMetaText, { color: theme.colors.textSecondary }]}>Traffic</Text>
          <Text style={[styles.simpleFareMetaText, { color: theme.colors.textPrimary }]}>{trafficLabel}</Text>
        </View>
        <Text style={[styles.simpleFareMetaText, { color: theme.colors.textSecondary }]}>{weatherDetail}</Text>
      </View>
    </View>
  );
}
