import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export function HomeSkeleton() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header gradient skeleton */}
      <Animated.View
        style={[
          styles.headerSkeleton,
          {
            backgroundColor: colors.primary + '20',
            opacity: pulseAnim,
          },
        ]}
      />

      {/* Booking card skeleton */}
      <Animated.View
        style={[
          styles.bookingCardSkeleton,
          {
            backgroundColor: colors.card || colors.background,
            borderColor: colors.border,
            opacity: pulseAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.bookingLine,
            { backgroundColor: colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.bookingLine,
            { backgroundColor: colors.border, marginTop: 8, width: '70%' },
          ]}
        />
      </Animated.View>

      {/* Stats cards skeleton */}
      <View style={styles.statsContainer}>
        {[1, 2, 3].map((item) => (
          <Animated.View
            key={item}
            style={[
              styles.statCardSkeleton,
              {
                backgroundColor: colors.card || colors.background,
                borderColor: colors.border,
                opacity: pulseAnim,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.statIcon,
                { backgroundColor: colors.border },
              ]}
            />
            <Animated.View
              style={[
                styles.statLine,
                { backgroundColor: colors.border },
              ]}
            />
            <Animated.View
              style={[
                styles.statValue,
                { backgroundColor: colors.border, marginTop: 8 },
              ]}
            />
          </Animated.View>
        ))}
      </View>

      {/* Upcoming rides skeleton */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Animated.View
          style={[
            styles.sectionTitle,
            { backgroundColor: colors.border, opacity: pulseAnim },
          ]}
        />
        {[1, 2].map((item) => (
          <Animated.View
            key={item}
            style={[
              styles.rideItemSkeleton,
              {
                backgroundColor: colors.card || colors.background,
                borderColor: colors.border,
                opacity: pulseAnim,
                marginTop: item === 1 ? 12 : 8,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.rideIcon,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Animated.View
                style={[
                  styles.rideLine,
                  { backgroundColor: colors.border },
                ]}
              />
              <Animated.View
                style={[
                  styles.rideLine,
                  { backgroundColor: colors.border, marginTop: 6, width: '70%' },
                ]}
              />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSkeleton: {
    height: 120,
  },
  bookingCardSkeleton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  bookingLine: {
    height: 14,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  statCardSkeleton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  statLine: {
    width: '70%',
    height: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  statValue: {
    width: '80%',
    height: 16,
    borderRadius: 4,
  },
  sectionTitle: {
    width: '40%',
    height: 16,
    borderRadius: 4,
  },
  rideItemSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  rideIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  rideLine: {
    height: 12,
    borderRadius: 4,
  },
});
