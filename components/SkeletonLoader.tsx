import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface MessageSkeletonProps {
  isOwn?: boolean;
  backgroundColor?: string;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  isOwn = false,
  backgroundColor = '#f0f0f0',
}) => {
  return (
    <View style={[styles.messageSkeleton, { alignItems: isOwn ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.messageContent, { backgroundColor }]}>
        <SkeletonLoader width={scale(200)} height={verticalScale(12)} style={{ marginBottom: verticalScale(8) }} />
        <SkeletonLoader width={scale(150)} height={verticalScale(12)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  messageSkeleton: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  messageContent: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    minWidth: scale(100),
    maxWidth: scale(280),
  },
});
