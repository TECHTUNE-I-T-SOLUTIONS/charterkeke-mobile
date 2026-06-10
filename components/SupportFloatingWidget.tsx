import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Text,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

interface SupportFloatingWidgetProps {
  route: string;
  bottom?: number;
}

export default function SupportFloatingWidget({ route, bottom = 110 }: SupportFloatingWidgetProps) {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const bounds = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    return {
      minX: -(width - 86),
      maxX: 0,
      minY: -(height - bottom - 160),
      maxY: 48,
    };
  }, [bottom]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          didDrag.current = false;
          pan.setOffset(lastOffset.current);
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, gesture) => {
          didDrag.current = true;
          pan.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          pan.flattenOffset();
          const nextOffset = {
            x: Math.min(bounds.maxX, Math.max(bounds.minX, lastOffset.current.x + gesture.dx)),
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
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, pan]
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
      <Pressable onPress={openSupport} style={styles.button}>
        <Image source={require('@/assets/support.png')} style={styles.image} resizeMode="contain" />
        <Text style={styles.text}>Customer Support</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 2,
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
  text: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    color: '#FFBB00',
    position: 'absolute',
    bottom: -46,
    shadowColor: '#B58605',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
