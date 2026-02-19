import React, { useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { COLORS } from '@/utils/colors';

interface SkeletonLoaderProps {
  isDark?: boolean;
  height?: number;
  width?: string | number;
  borderRadius?: number;
  marginBottom?: number;
}

const SkeletonLoader = ({
  isDark = false,
  height = 16,
  width = '100%',
  borderRadius = 4,
  marginBottom = 12,
}: SkeletonLoaderProps) => {
  const [pulse] = React.useState(new Animated.Value(0));
  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={{
        height,
        width: width as any,
        backgroundColor: colors.border + '40',
        borderRadius,
        marginBottom,
        opacity,
      } as any}
    />
  );
};

interface CardSkeletonProps {
  isDark?: boolean;
  itemCount?: number;
}

const CardSkeleton = ({ isDark = false, itemCount = 3 }: CardSkeletonProps) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View>
      {Array(itemCount)
        .fill(0)
        .map((_, index) => (
          <View
            key={index}
            style={{
              padding: 16,
              backgroundColor: colors.background,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <SkeletonLoader isDark={isDark} height={20} width="60%" marginBottom={8} />
            <SkeletonLoader isDark={isDark} height={14} width="100%" marginBottom={8} />
            <SkeletonLoader isDark={isDark} height={14} width="80%" marginBottom={0} />
          </View>
        ))}
    </View>
  );
};

export { SkeletonLoader, CardSkeleton };
