import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BRAND } from '@/utils/colors';

const { width } = Dimensions.get('window');
const SIDE_PADDING = 20;
const SLIDE_GAP = 12;
const SLIDE_WIDTH = width - SIDE_PADDING * 2;
const SLIDE_HEIGHT = Math.round(SLIDE_WIDTH / 2.5);

export type HomePromoSlide = {
  id: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  accessibilityLabel?: string;
};

type Props = {
  slides: HomePromoSlide[];
  style?: StyleProp<ViewStyle>;
};

export default function HomePromoCarousel({ slides, style }: Props) {
  const { theme } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      if (!scrollRef.current) return;
      indexRef.current = (indexRef.current + 1) % slides.length;
      scrollRef.current.scrollTo({
        x: indexRef.current * (SLIDE_WIDTH + SLIDE_GAP),
        animated: true,
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <View style={[styles.container, style]}>
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SLIDE_WIDTH + SLIDE_GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={(event) => {
          indexRef.current = Math.round(event.nativeEvent.contentOffset.x / (SLIDE_WIDTH + SLIDE_GAP));
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        accessibilityRole="scrollbar"
        accessibilityLabel="Charter Keke promotional carousel"
      >
        {slides.map((slide) => {
          const image = (
            <Image
              source={slide.image}
              style={styles.image}
              resizeMode="cover"
            />
          );

          if (slide.onPress) {
            return (
              <Pressable
                key={slide.id}
                onPress={slide.onPress}
                style={({ pressed }) => [
                  styles.slide,
                  { borderColor: theme.colors.border, opacity: pressed ? 0.9 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={slide.accessibilityLabel || 'Open Charter Keke promo'}
              >
                {image}
              </Pressable>
            );
          }

          return (
            <View key={slide.id} style={[styles.slide, { borderColor: theme.colors.border }]}>
              {image}
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.dotsWrap} pointerEvents="none">
        {slides.map((slide, index) => {
          const offset = index * (SLIDE_WIDTH + SLIDE_GAP);
          const inputRange = [offset - SLIDE_WIDTH, offset, offset + SLIDE_WIDTH];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.35, 1, 0.35],
            extrapolate: 'clamp',
          });
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1.2, 0.9],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={`promo-dot-${slide.id}`}
              style={[
                styles.dot,
                {
                  backgroundColor: index === 0 ? BRAND.primary : '#FFFFFF',
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: SIDE_PADDING,
    gap: SLIDE_GAP,
  },
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0F1117',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dotsWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },
});
