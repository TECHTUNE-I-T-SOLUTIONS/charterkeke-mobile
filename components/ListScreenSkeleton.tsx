import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export function ListScreenSkeleton({ itemCount = 3 }: { itemCount?: number }) {
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Array(itemCount)
        .fill(0)
        .map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.item,
              {
                backgroundColor: colors.card || colors.background,
                borderColor: colors.border,
                opacity: pulseAnim,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Animated.View
                style={[
                  styles.line,
                  { backgroundColor: colors.border, width: '70%' },
                ]}
              />
              <Animated.View
                style={[
                  styles.line,
                  { backgroundColor: colors.border, width: '90%', marginTop: 8 },
                ]}
              />
              <Animated.View
                style={[
                  styles.line,
                  { backgroundColor: colors.border, width: '60%', marginTop: 8 },
                ]}
              />
            </View>
            <Animated.View
              style={[
                styles.badge,
                { backgroundColor: colors.border },
              ]}
            />
          </Animated.View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  line: {
    height: 12,
    borderRadius: 4,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 8,
  },
});

export function BalanceCardSkeleton() {
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
    <Animated.View
      style={[
        styles.balanceCard,
        {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
          opacity: pulseAnim,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.balanceLabel,
            { backgroundColor: colors.border },
          ]}
        />
        <Animated.View
          style={[
            styles.balanceAmount,
            { backgroundColor: colors.border, marginTop: 8 },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles2 = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  balanceLabel: {
    width: '40%',
    height: 12,
    borderRadius: 4,
  },
  balanceAmount: {
    width: '60%',
    height: 28,
    borderRadius: 4,
  },
});
