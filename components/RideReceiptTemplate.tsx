import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { normalizeRideReceipt, RideReceiptAudience } from '@/utils/rideReceipt';

type Props = {
  ride: Record<string, any>;
  audience: RideReceiptAudience;
};

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export function RideReceiptTemplate({ ride, audience }: Props) {
  const data = normalizeRideReceipt(ride, audience);
  const isDriver = audience === 'driver';
  const totalLabel = isDriver ? 'Driver Earning' : 'Total Payable';
  const totalValue = isDriver ? data.driverEarnings : data.total;

  return (
    <View style={styles.stage}>
      <View style={styles.receipt}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <Image source={{ uri: 'https://admin.charterkeke.com/charter%20keke.png' }} style={styles.logo} />
            <View>
              <Text style={styles.brand}>CHARTER KEKE</Text>
              <Text style={styles.title}>{isDriver ? 'Driver Ride Sheet' : 'Ride Receipt'}</Text>
            </View>
          </View>
          <View style={styles.pillRow}>
            <Text style={styles.pill}>{data.number}</Text>
            <Text style={styles.pill}>{data.status}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>{data.createdAt}</Text>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Rider</Text>
              <Text style={styles.value}>{data.riderName}</Text>
              {data.riderPhone ? <Text style={styles.muted}>{data.riderPhone}</Text> : null}
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Driver</Text>
              <Text style={styles.value}>{data.driverName}</Text>
              <Text style={styles.muted}>{`${data.vehicle}${data.plateNumber ? ` • ${data.plateNumber}` : ''}`}</Text>
            </View>
          </View>

          <View style={styles.routeCard}>
            <View style={styles.timeline}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={styles.square} />
            </View>
            <View style={styles.routeText}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.address}>{data.pickup}</Text>
              {data.pickupDescription ? <Text style={styles.muted}>{data.pickupDescription}</Text> : null}
              <View style={styles.routeGap} />
              <Text style={styles.label}>Dropoff</Text>
              <Text style={styles.address}>{data.dropoff}</Text>
              {data.dropoffDescription ? <Text style={styles.muted}>{data.dropoffDescription}</Text> : null}
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{data.distance ? `${data.distance.toFixed(1)} km` : 'Not calculated'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>{data.duration ? `${Math.round(data.duration)} min` : 'Not calculated'}</Text>
            </View>
          </View>

          <View style={styles.fareCard}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Ride Fare</Text>
              <Text style={styles.fareValue}>{money(data.fare)}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>{isDriver ? 'Platform Fee' : 'Platform & Booking Fee'}</Text>
              <Text style={styles.fareValue}>{isDriver ? '-' : ''}{money(data.platformFee)}</Text>
            </View>
            <View style={styles.fareDivider} />
            <View style={styles.fareRow}>
              <Text style={styles.totalLabel}>{totalLabel}</Text>
              <Text style={styles.totalValue}>{money(totalValue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Keep this receipt for pickup confirmation and support reference.</Text>
        </View>
      </View>
    </View>
  );
}

export const RECEIPT_CAPTURE_WIDTH = 1080;
export const RECEIPT_CAPTURE_HEIGHT = 1350;

const styles = StyleSheet.create({
  stage: {
    width: RECEIPT_CAPTURE_WIDTH,
    minHeight: RECEIPT_CAPTURE_HEIGHT,
    backgroundColor: '#F6F2EC',
    padding: 70,
  },
  receipt: {
    minHeight: 1210,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#F0DEC8',
  },
  hero: { backgroundColor: '#111111', padding: 50 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  logo: { width: 92, height: 92, borderRadius: 24, backgroundColor: '#FF8A00' },
  brand: { color: '#FF8A00', fontSize: 24, fontWeight: '900', letterSpacing: 5 },
  title: { color: '#FFFFFF', fontSize: 54, fontWeight: '900', marginTop: 10 },
  pillRow: { flexDirection: 'row', gap: 16, marginTop: 34 },
  pill: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    fontSize: 24,
    fontWeight: '900',
  },
  body: { padding: 50, gap: 24 },
  summaryCard: { backgroundColor: '#FFF8EF', borderColor: '#F0DEC8', borderWidth: 2, borderRadius: 26, padding: 26 },
  twoCol: { flexDirection: 'row', gap: 22 },
  infoCard: { flex: 1, backgroundColor: '#FFFDF9', borderColor: '#F0DEC8', borderWidth: 2, borderRadius: 26, padding: 26 },
  label: { color: '#7C5B37', fontSize: 20, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  value: { color: '#171717', fontSize: 30, fontWeight: '900', lineHeight: 40 },
  muted: { color: '#6B7280', fontSize: 22, fontWeight: '600', lineHeight: 31, marginTop: 8 },
  routeCard: { flexDirection: 'row', backgroundColor: '#FFFDF9', borderColor: '#F0DEC8', borderWidth: 2, borderRadius: 28, padding: 28 },
  timeline: { width: 34, alignItems: 'center', marginRight: 20, paddingTop: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF8A00' },
  line: { width: 4, flex: 1, minHeight: 92, backgroundColor: '#E9D8C2', marginVertical: 10 },
  square: { width: 18, height: 18, borderWidth: 4, borderColor: '#111111' },
  routeText: { flex: 1 },
  address: { color: '#171717', fontSize: 32, fontWeight: '900', lineHeight: 42 },
  routeGap: { height: 32 },
  fareCard: { backgroundColor: '#111111', borderRadius: 30, padding: 32 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 30, paddingVertical: 14 },
  fareLabel: { color: '#FFFFFF', fontSize: 25, fontWeight: '700' },
  fareValue: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  fareDivider: { height: 2, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 10 },
  totalLabel: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  totalValue: { color: '#FF8A00', fontSize: 46, fontWeight: '900' },
  footer: { backgroundColor: '#FF8A00', paddingHorizontal: 50, paddingVertical: 26 },
  footerText: { color: '#111111', fontSize: 24, fontWeight: '900' },
});
