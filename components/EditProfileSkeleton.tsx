import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export function EditProfileSkeleton() {
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

  const SkeletonLine = ({ width = '100%', height = 16, marginBottom = 8 }) => (
    <Animated.View
      style={[
        styles.skeletonLine,
        {
          width,
          height,
          marginBottom,
          backgroundColor: colors.border,
          opacity: pulseAnim,
        },
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Image Skeleton */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card || colors.surfaceLight,
            borderColor: colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.profileImageSkeleton,
            {
              backgroundColor: colors.border,
              opacity: pulseAnim,
            },
          ]}
        />
      </View>

      {/* Form Fields Skeleton */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card || colors.surfaceLight,
            borderColor: colors.border,
          },
        ]}
      >
        {/* First Name */}
        <View style={styles.formGroup}>
          <SkeletonLine width="40%" height={12} marginBottom={8} />
          <SkeletonLine width="100%" height={40} marginBottom={16} />
        </View>

        {/* Last Name */}
        <View style={styles.formGroup}>
          <SkeletonLine width="40%" height={12} marginBottom={8} />
          <SkeletonLine width="100%" height={40} marginBottom={16} />
        </View>

        {/* Email */}
        <View style={styles.formGroup}>
          <SkeletonLine width="30%" height={12} marginBottom={8} />
          <SkeletonLine width="100%" height={40} marginBottom={16} />
        </View>

        {/* Phone */}
        <View style={styles.formGroup}>
          <SkeletonLine width="40%" height={12} marginBottom={8} />
          <SkeletonLine width="100%" height={40} marginBottom={0} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileImageSkeleton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  skeletonLine: {
    borderRadius: 4,
  },
});
