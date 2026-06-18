import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type Props = {
  theme: any;
  styles: any;
  pickupAddress: string;
  dropoffAddress: string;
  bookingTotalFare: number;
  isBooking: boolean;
  onReview: () => void;
};

export function BookingReviewCard({
  theme,
  styles,
  pickupAddress,
  dropoffAddress,
  bookingTotalFare,
  isBooking,
  onReview,
}: Props) {
  return (
    <>
      <View style={[styles.reviewRouteCard, { borderColor: theme.colors.border, marginTop: 12, alignItems: 'center' }]}>
        <View style={styles.reviewRouteRow}>
          <View style={[styles.reviewDot, { backgroundColor: BRAND.primary }]} />
          <Text numberOfLines={2} style={[styles.confirmAddress, { color: theme.colors.textPrimary }]}>{pickupAddress}</Text>
        </View>
        <MaterialCommunityIcons name="arrow-down" size={18} color={BRAND.primary} />
        <View style={styles.reviewRouteRow}>
          <View style={[styles.reviewDot, { backgroundColor: theme.colors.textPrimary }]} />
          <Text numberOfLines={2} style={[styles.confirmAddress, { color: theme.colors.textPrimary }]}>{dropoffAddress}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.reviewButton, { backgroundColor: isBooking ? theme.colors.border : BRAND.primary }]}
        disabled={isBooking}
        onPress={onReview}
        activeOpacity={0.9}
      >
        {isBooking ? <ActivityIndicator color="#000" /> : <Text style={styles.reviewButtonText}>Review Ride</Text>}
      </TouchableOpacity>
      <View style={[styles.reviewFooterPill, { alignItems: 'center', marginTop: 4 }]}>
        <MaterialCommunityIcons name="shield-check" size={15} color={BRAND.primary} />
        <Text style={[styles.reviewFooterText, { color: theme.colors.textSecondary }]}>Total fare N{bookingTotalFare.toLocaleString()}</Text>
      </View>
    </>
  );
}
