import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export function BookingSkeleton() {
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
      {/* Header skeleton */}
      <Animated.View
        style={[
          styles.headerSkeleton,
          {
            backgroundColor: colors.border,
            opacity: pulseAnim,
          },
        ]}
      />

      {/* Map skeleton */}
      <Animated.View
        style={[
          styles.mapSkeleton,
          {
            backgroundColor: colors.border,
            opacity: pulseAnim,
          },
        ]}
      />

      {/* Bottom sheet skeleton */}
      <Animated.View
        style={[
          styles.bottomSheetSkeleton,
          {
            backgroundColor: colors.card || colors.background,
            borderColor: colors.border,
            opacity: pulseAnim,
          },
        ]}
      >
        {/* Input fields */}
        {[1, 2, 3].map((item) => (
          <Animated.View
            key={item}
            style={[
              styles.inputSkeleton,
              { backgroundColor: colors.border, marginTop: item > 1 ? 12 : 0 },
            ]}
          />
        ))}

        {/* Button skeleton */}
        <Animated.View
          style={[
            styles.buttonSkeleton,
            { backgroundColor: colors.primary + '30', marginTop: 16 },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSkeleton: {
    height: 60,
  },
  mapSkeleton: {
    flex: 1,
    marginVertical: 16,
  },
  bottomSheetSkeleton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 200,
  },
  inputSkeleton: {
    height: 40,
    borderRadius: 8,
  },
  buttonSkeleton: {
    height: 44,
    borderRadius: 8,
  },
});
