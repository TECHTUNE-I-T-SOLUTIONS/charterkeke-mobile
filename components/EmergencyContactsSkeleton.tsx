import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export function EmergencyContactsSkeleton() {
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

  const ContactCard = () => (
    <Animated.View
      style={[
        styles.contactCard,
        {
          borderColor: colors.border,
          backgroundColor: colors.card || colors.background,
          opacity: pulseAnim,
        },
      ]}
    >
      <View style={styles.contactLeft}>
        <Animated.View
          style={[
            styles.iconSkeleton,
            { backgroundColor: colors.border },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Animated.View
            style={[
              styles.nameSkeleton,
              { backgroundColor: colors.border },
            ]}
          />
          <Animated.View
            style={[
              styles.subtleSkeleton,
              { backgroundColor: colors.border, marginTop: 8 },
            ]}
          />
          <Animated.View
            style={[
              styles.subtleSkeleton,
              { backgroundColor: colors.border, marginTop: 8 },
            ]}
          />
        </View>
      </View>
      <Animated.View
        style={[
          styles.actionSkeleton,
          { backgroundColor: colors.border },
        ]}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ContactCard />
      <ContactCard />
      <ContactCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 80,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  nameSkeleton: {
    width: 120,
    height: 13,
    borderRadius: 4,
  },
  subtleSkeleton: {
    width: 100,
    height: 11,
    borderRadius: 4,
  },
  actionSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
});
