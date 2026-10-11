import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { COLORS, BRAND } from '@/utils/colors';

interface RideRoadProgressCardProps {
  status: 'accepted' | 'in_progress' | string;
  distanceKm: number;
  etaMinutes: number;
  pickupZone: string;
  destinationZone: string;
  driverName?: string;
}

export const RideRoadProgressCard: React.FC<RideRoadProgressCardProps> = ({
  status,
  distanceKm,
  etaMinutes,
  pickupZone,
  destinationZone,
  driverName = 'Driver',
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const isAccepted = status === 'accepted';
  const isInProgress = status === 'in_progress';

  // Calculate progress percentage along the road (0% = far, 100% = arrived)
  // Distance range assuming ~5km max single trip leg preview or normalized distance
  const progressPercent = useMemo(() => {
    if (distanceKm <= 0.05) return 98; // arrived
    // As distance decreases from 3km to 0km, progress increases from 10% to 95%
    const normalized = Math.max(0, Math.min(1, (3.0 - distanceKm) / 3.0));
    return Math.round(10 + normalized * 85);
  }, [distanceKm]);

  const targetLabel = isAccepted ? 'Pickup Point' : 'Destination';
  const targetLocation = isAccepted ? pickupZone : destinationZone;
  const targetIcon = isAccepted ? 'account-pin-outline' : 'map-marker-check';
  const headerTitle = isAccepted ? 'Driver En Route to Pickup' : 'Trip in Progress';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons
            name={isAccepted ? 'steering' : 'car-side'}
            size={18}
            color={BRAND.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>{headerTitle}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: isDark ? '#1a2e1a' : '#e6f4ea' }]}>
          <Text style={[styles.badgeText, { color: '#10b981' }]}>
            {distanceKm > 0
              ? distanceKm < 1
                ? `${Math.round(distanceKm * 1000)}m away`
                : `${distanceKm.toFixed(1)} km away`
              : 'Arriving now'}
          </Text>
        </View>
      </View>

      {/* Visual Road Line Representation */}
      <View style={styles.roadContainer}>
        {/* Road Track */}
        <View style={[styles.roadLine, { backgroundColor: isDark ? '#333' : '#e2e8f0' }]}>
          {/* Progress fill */}
          <View
            style={[
              styles.roadFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: BRAND.primary,
              },
            ]}
          />
        </View>

        {/* Start Point (Driver Base) */}
        <View style={[styles.node, styles.startNode, { backgroundColor: isDark ? '#222' : '#f1f5f9' }]}>
          <MaterialCommunityIcons name="numeric-1-circle" size={16} color={colors.textSecondary} />
        </View>

        {/* Moving Keke Icon on the Road */}
        <View style={[styles.kekePosition, { left: `${Math.min(90, Math.max(8, progressPercent))}%` }]}>
          <View style={[styles.kekeBubble, { backgroundColor: BRAND.primary }]}>
            <MaterialCommunityIcons name={"keke" as any} size={18} color="#000" />
          </View>
        </View>

        {/* Target Point (Rider Pickup or Dropoff Pin) */}
        <View style={[styles.node, styles.endNode, { backgroundColor: '#10b981' }]}>
          <MaterialCommunityIcons name={targetIcon as any} size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* Footer Labels */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{driverName}</Text>
          <Text style={[styles.footerSub, { color: colors.text }]} numberOfLines={1}>
            Heading to {targetLabel}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Est. Time</Text>
          <Text style={[styles.etaText, { color: BRAND.primary }]}>
            {etaMinutes > 0 ? `~${etaMinutes} min` : 'Less than 1 min'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roadContainer: {
    height: 44,
    justifyContent: 'center',
    marginVertical: 4,
  },
  roadLine: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  roadFill: {
    height: '100%',
    borderRadius: 3,
  },
  node: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 3,
  },
  startNode: {
    left: 0,
  },
  endNode: {
    right: 0,
  },
  kekePosition: {
    position: 'absolute',
    top: -8,
    marginLeft: -16,
    zIndex: 5,
  },
  kekeBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
});
