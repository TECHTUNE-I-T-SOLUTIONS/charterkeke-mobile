import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TourTarget } from '@/components/GuidedTour';

interface SupportFloatingWidgetProps {
  route: string;
  bottom?: number;
  tourId?: string;
}

export default function SupportFloatingWidget({ route, bottom = 110, tourId }: SupportFloatingWidgetProps) {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const bounds = useMemo(() => {
    const { height } = Dimensions.get('window');
    return {
      minY: -(height - bottom - 160),
      maxY: 48,
    };
  }, [bottom]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          didDrag.current = false;
          pan.setOffset({ x: 0, y: lastOffset.current.y });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, gesture) => {
          didDrag.current = true;
          pan.setValue({ x: 0, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          pan.flattenOffset();
          const nextOffset = {
            x: 0,
            y: Math.min(bounds.maxY, Math.max(bounds.minY, lastOffset.current.y + gesture.dy)),
          };
          lastOffset.current = nextOffset;
          Animated.spring(pan, {
            toValue: nextOffset,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        },
      }),
    [bounds.maxY, bounds.minY, pan]
  );

  const openSupport = () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    router.push(route as any);
  };

  return (
    <Animated.View
      style={[styles.wrap, { bottom, transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <TourTarget id={tourId || 'support-floating-widget'}>
        <Pressable onPress={openSupport} style={styles.button}>
          <Image source={require('@/assets/support.png')} style={styles.image} resizeMode="contain" />
        </Pressable>
      </TourTarget>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: -26,
    zIndex: 20,
  },
  button: {
    width: 100,
    height: 60,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  image: {
    width: 200,
    height: 160,
  },
});
