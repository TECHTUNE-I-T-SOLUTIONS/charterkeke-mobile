import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface PromotionalAd {
  id: string;
  title: string;
  description: string;
  subtitle?: string;
  lottieUrl: string;
  gradient: [string, string];
  features: string[];
  cta: string;
  color: string;
}

const PROMOTIONAL_ADS: PromotionalAd[] = [
  {
    id: 'fast-service',
    title: 'Late for Work?',
    subtitle: 'No Problem!',
    description: 'Book a keke in seconds. Fastest pickup in your area.',
    lottieUrl: 'https://lottie.host/2ef43215-f379-43be-813f-8a46aa0797e2/srp8VUeWaI.lottie',
    gradient: ['#ff6b6b', '#ee5a52'],
    features: ['10-min arrival', 'Live tracking', 'Verified drivers'],
    cta: 'Book Now',
    color: '#ff6b6b',
  },
  {
    id: 'affordable-reliable',
    title: 'Affordable & Reliable',
    subtitle: 'Budget-Friendly',
    description: 'Transparent pricing with no hidden charges. Pay directly to your driver when you arrive.',
    lottieUrl: 'https://lottie.host/e1afafd0-e325-4748-944d-f8a8afffd870/JO0mekLQO9.lottie',
    gradient: ['#10b981', '#059669'],
    features: ['Clear pricing', 'Direct payment', 'Verified drivers'],
    cta: 'Save on Rides',
    color: '#10b981',
  },
  {
    id: 'safe-secure',
    title: 'Booking Confirmed!',
    subtitle: 'Success!',
    description: 'Your ride is booked. Driver is on the way. Pay directly to your driver when you arrive.',
    lottieUrl: 'https://lottie.host/48d3f1e4-d6bc-4135-8c18-64d9e0a9dcfb/968WXfvW8k.lottie',
    gradient: ['#8b5cf6', '#ec4899'],
    features: ['✓ No platform fees', '✓ Driver gets full payment', '✓ Easy & transparent'],
    cta: 'Ready to Ride',
    color: '#8b5cf6',
  },
  {
    id: 'instant-booking',
    title: '"Book Now" Done!',
    subtitle: 'One Click Away',
    description: 'Click, book, and go! Your keke driver is already heading your way.',
    lottieUrl: 'https://lottie.host/5029e112-643a-4da9-8444-9da808651738/ol0uSp4qXp.lottie',
    gradient: ['#0ea5e9', '#06b6d4'],
    features: ['⚡ Fastest booking', '✓ Instant confirmation', '✓ Live tracking'],
    cta: 'Start Booking',
    color: '#0ea5e9',
  },
  {
    id: 'fair-payment',
    title: 'Direct Driver Payment',
    subtitle: 'Fair to Drivers',
    description: 'Pay your driver directly in cash when you arrive.',
    lottieUrl: 'https://lottie.host/4b3e0ebe-312c-415b-ab89-df94f50a6c04/SoW3VMwH93.lottie',
    gradient: ['#f97316', '#ea580c'],
    features: ['💰 No middleman fees', '✓ 100% to driver', '✓ Transparent pricing'],
    cta: 'Book a Ride',
    color: '#f97316',
  },
];

interface PromotionalAdCarouselProps {
  onBookNowPress?: () => void;
}

export function PromotionalAdCarousel({ onBookNowPress }: PromotionalAdCarouselProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations on slide change
    fadeAnim.setValue(0);
    slideAnim.setValue(0);
    textAnim.setValue(0);

    // Fade in animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % PROMOTIONAL_ADS.length;
      setCurrentIndex(nextIndex);
    }, 6000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentAd = PROMOTIONAL_ADS[currentIndex];

  return (
    <View style={styles.container}>
      {/* Video-style Ad Card */}
      <Animated.View
        style={[
          styles.adCard,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={currentAd.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Lottie Animation */}
          <View style={styles.lottieContainer}>
            <LottieView
              source={{ uri: currentAd.lottieUrl }}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          {/* Video-like overlay gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          />

          {/* Text Content - positioned at bottom like video subtitle */}
          <Animated.View
            style={[
              styles.textContent,
              {
                opacity: textAnim,
                transform: [
                  {
                    translateY: textAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: currentAd.color }]}>
              <Text style={styles.badgeText}>{currentAd.subtitle}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{currentAd.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentAd.description}</Text>

            {/* Features as key points */}
            <View style={styles.featuresContainer}>
              {currentAd.features.map((feature, index) => (
                <Text key={index} style={styles.featureText}>
                  {feature}
                </Text>
              ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: currentAd.color }]}
              onPress={onBookNowPress}
            >
              <Text style={styles.ctaText}>{currentAd.cta}</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color="white"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Decorative elements */}
          <View style={[styles.decorator, styles.decorator1]} />
          <View style={[styles.decorator, styles.decorator2]} />
        </LinearGradient>
      </Animated.View>

      {/* Carousel Indicators */}
      <View style={styles.indicatorsContainer}>
        {PROMOTIONAL_ADS.map((ad, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setCurrentIndex(index)}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentIndex
                    ? ad.color
                    : 'rgba(0, 0, 0, 0.15)',
                width: index === currentIndex ? 32 : 8,
                height: 6,
              },
            ]}
          />
        ))}
      </View>

      {/* Slide counter */}
      <Text style={styles.slideCounter}>
        {currentIndex + 1} / {PROMOTIONAL_ADS.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 12,
  },
  adCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  gradientContainer: {
    height: 420,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  lottieContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    zIndex: 1,
  },
  textContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    zIndex: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    lineHeight: 40,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 16,
    gap: 6,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  ctaButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: Platform.OS === 'android' ? 4 : 2,
  },
  ctaText: {
    fontWeight: '700',
    fontSize: 14,
    color: 'white',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 10,
  },
  indicator: {
    borderRadius: 3,
  },
  slideCounter: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  decorator: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  decorator1: {
    width: 240,
    height: 240,
    top: -100,
    right: -80,
  },
  decorator2: {
    width: 180,
    height: 180,
    bottom: -60,
    left: -50,
  },
});
