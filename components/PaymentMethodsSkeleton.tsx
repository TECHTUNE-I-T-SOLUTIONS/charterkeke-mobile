import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export function PaymentMethodsSkeleton() {
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

  const MethodCard = () => (
    <Animated.View
      style={[
        styles.methodCard,
        {
          borderColor: colors.border,
          backgroundColor: colors.card || colors.background,
          opacity: pulseAnim,
        },
      ]}
    >
      <View style={styles.methodLeft}>
        <Animated.View
          style={[
            styles.iconSkeleton,
            { backgroundColor: colors.border },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Animated.View
            style={[
              styles.methodNameSkeleton,
              { backgroundColor: colors.border },
            ]}
          />
          <Animated.View
            style={[
              styles.methodDetailsSkeleton,
              { backgroundColor: colors.border, marginTop: 6 },
            ]}
          />
          <Animated.View
            style={[
              styles.badgeSkeleton,
              { backgroundColor: colors.border, marginTop: 6 },
            ]}
          />
        </View>
      </View>
      <Animated.View
        style={[
          styles.chevronSkeleton,
          { backgroundColor: colors.border },
        ]}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MethodCard />
      <MethodCard />
      <MethodCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 90,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  methodNameSkeleton: {
    width: 100,
    height: 13,
    borderRadius: 4,
  },
  methodDetailsSkeleton: {
    width: 80,
    height: 11,
    borderRadius: 4,
  },
  badgeSkeleton: {
    width: 60,
    height: 10,
    borderRadius: 4,
  },
  chevronSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
