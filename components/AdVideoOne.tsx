import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface PromotionalAd {
  id: string;
  title: string;
  problem: string;
  solution: string;
  benefit: string;
  icon: string;
  gradient: [string, string];
  highlights: { icon: string; text: string }[];
  cta: string;
  imageUrl: string;
  color: string;
  accentColor: string;
}

const PROMOTIONAL_ADS: PromotionalAd[] = [
  {
    id: 'traffic-wait',
    title: '⏳ Tired of Waiting?',
    problem: 'Traffic jam + slow taxi = Late to work, late to meetings, late to life',
    solution: 'Book a KEKE in seconds. Personal, fast, and direct to your destination.',
    benefit: 'Cut your commute time in HALF with direct keke rides',
    icon: 'clock-fast',
    gradient: ['#ff6b6b', '#ee5a52'],
    highlights: [
      { icon: 'flash', text: '10-min pickup' },
      { icon: 'navigation', text: 'Direct route' },
      { icon: 'check-circle', text: 'No waiting' },
    ],
    cta: 'Book Now - Fastest Ride',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop',
    color: '#ff6b6b',
    accentColor: '#ee5a52',
  },
  {
    id: 'personal-ride',
    title: '👤 Ride ALONE',
    problem: 'Squashed in shared taxis? No privacy, no comfort, constant stops',
    solution: 'Your own KEKE. Just you and the open road. No strangers. No stops.',
    benefit: 'Personal space, comfort, and zero distractions to your destination',
    icon: 'chair-rolling',
    gradient: ['#8b5cf6', '#a855f7'],
    highlights: [
      { icon: 'account-circle', text: 'Ride Alone' },
      { icon: 'sofa', text: 'Your Space' },
      { icon: 'stop-circle', text: 'Zero Stops' },
    ],
    cta: 'Get Your Personal Keke',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3effff991c?w=600&h=600&fit=crop',
    color: '#8b5cf6',
    accentColor: '#a855f7',
  },
  {
    id: 'cheap-rides',
    title: '💰 Afford More Rides',
    problem: 'Uber/Bolt draining your wallet? N2,000 for 5km in Lagos traffic is crazy',
    solution: 'KEKE fares = 40% cheaper. Pay directly to driver. No app fees. No hidden charges.',
    benefit: 'Same speed as expensive apps, but pocket-friendly prices every single time',
    icon: 'currency-usd',
    gradient: ['#10b981', '#059669'],
    highlights: [
      { icon: 'percent', text: '40% Cheaper' },
      { icon: 'cash-check', text: 'Direct Pay' },
      { icon: 'shield-check', text: 'No Hidden Fees' },
    ],
    cta: 'Save Money - Book Keke',
    imageUrl: 'https://images.unsplash.com/photo-1573937506759-0eed69e47da0?w=600&h=600&fit=crop',
    color: '#10b981',
    accentColor: '#059669',
  },
  {
    id: 'fast-movement',
    title: '⚡ KEKES = SPEED',
    problem: 'Buses get stuck in traffic. Cars avoid rough roads. You waste time.',
    solution: 'KEKES navigate Lagos like they own it. Narrow lanes? No problem. Potholes? Easy.',
    benefit: 'Fastest way to move around Lagos traffic - agile, quick, unstoppable',
    icon: 'speedometer',
    gradient: ['#0ea5e9', '#06b6d4'],
    highlights: [
      { icon: 'directions-fork', text: 'Navigate Traffic' },
      { icon: 'road', text: 'All Routes' },
      { icon: 'lightning-bolt', text: 'Super Fast' },
    ],
    cta: 'Experience Keke Speed',
    imageUrl: 'https://images.unsplash.com/photo-1464219414179-4eb3854af2d7?w=600&h=600&fit=crop',
    color: '#0ea5e9',
    accentColor: '#06b6d4',
  },
  {
    id: 'reliable-driver',
    title: '✓ ALWAYS AVAILABLE',
    problem: 'Taxis ghost you. Apps cancel last minute. You\'re stuck waiting.',
    solution: 'Our KEKES are ALWAYS there. Reliable. Verified. Ready. Every time.',
    benefit: 'Consistent, dependable rides you can trust - from early morning to late night',
    icon: 'shield-star',
    gradient: ['#f97316', '#ea580c'],
    highlights: [
      { icon: 'check-circle', text: 'Verified Drivers' },
      { icon: 'clock-check', text: '24/7 Available' },
      { icon: 'star', text: 'Rated & Safe' },
    ],
    cta: 'Trust KEKE - Book Now',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop',
    color: '#f97316',
    accentColor: '#ea580c',
  },
  {
    id: 'final-cta',
    title: '🚀 STOP WASTING TIME',
    problem: 'Every minute stuck = Money lost, Time lost, Energy lost',
    solution: 'Smart Lagos residents use KEKE. Fast. Cheap. Personal. Reliable.',
    benefit: 'Join thousands moving smarter around Lagos. Your life starts moving today.',
    icon: 'rocket',
    gradient: ['#ec4899', '#db2777'],
    highlights: [
      { icon: 'trending-up', text: 'Thousands Using' },
      { icon: 'emoticon-happy', text: '5-Star Rated' },
      { icon: 'lightning-bolt', text: 'Smart Choice' },
    ],
    cta: '🔥 Book Your Keke Now',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop',
    color: '#ec4899',
    accentColor: '#db2777',
  },
];

interface AdVideoOneProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

export function AdVideoOne({ onBookNowPress, onSkip }: AdVideoOneProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const benefitSlideAnim = useRef(new Animated.Value(0)).current;

  // Play background audio throughout entire video
  useEffect(() => {
    const playBackgroundAudio = async () => {
      try {
        if (sound) {
          await sound.unloadAsync();
        }

        // Use first audio file throughout the entire video
        const audioFile = require('../assets/promotional-ads/ads-audio (1).mp3');
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile, {
          isLooping: true,
        });
        setSound(newSound);
        await newSound.playAsync();
      } catch (error) {
        console.log('Audio playback error:', error);
      }
    };

    playBackgroundAudio();

    return () => {
      sound?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    fadeAnim.setValue(0);
    textAnim.setValue(0);
    iconAnim.setValue(0);
    benefitSlideAnim.setValue(0);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(benefitSlideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMOTIONAL_ADS.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const currentAd = PROMOTIONAL_ADS[currentIndex];

  return (
    <View style={styles.container}>
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
          <Image
            source={{ uri: currentAd.imageUrl }}
            style={styles.backgroundImage}
          />

          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.1)',
              'rgba(0, 0, 0, 0.3)',
              'rgba(0, 0, 0, 0.8)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overlay}
          />

          {/* Decorative top-left elements */}
          <View style={[styles.decorativeCircle, styles.topLeft, { backgroundColor: currentAd.accentColor }]} />
          <View style={[styles.decorativeLine, styles.lineTopRight, { backgroundColor: currentAd.accentColor }]} />

          {/* Close/Skip Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={28}
              color="rgba(255, 255, 255, 0.9)"
            />
          </TouchableOpacity>

          <View style={styles.contentWrapper}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  opacity: iconAnim,
                  transform: [
                    {
                      scale: iconAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: currentAd.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={currentAd.icon as any}
                  size={44}
                  color="white"
                />
              </View>
            </Animated.View>

            <Animated.View
              style={[
                {
                  opacity: textAnim,
                  transform: [
                    {
                      translateY: textAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.title}>{currentAd.title}</Text>
            </Animated.View>

            <Animated.View
              style={[
                {
                  opacity: textAnim,
                  transform: [
                    {
                      translateY: textAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [35, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.problemSection}>
                <Text style={styles.problemLabel}>The Problem:</Text>
                <Text style={styles.problemText}>{currentAd.problem}</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                {
                  opacity: textAnim,
                  transform: [
                    {
                      translateY: textAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.solutionSection}>
                <Text style={styles.solutionLabel}>✓ The Solution:</Text>
                <Text style={styles.solutionText}>{currentAd.solution}</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.highlightsContainer,
                {
                  opacity: benefitSlideAnim,
                  transform: [
                    {
                      translateY: benefitSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {currentAd.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <MaterialCommunityIcons
                    name={highlight.icon as any}
                    size={18}
                    color={currentAd.color}
                    style={styles.highlightIcon}
                  />
                  <Text style={styles.highlightText}>{highlight.text}</Text>
                </View>
              ))}
            </Animated.View>

            <Animated.View
              style={[
                {
                  opacity: benefitSlideAnim,
                  transform: [
                    {
                      translateY: benefitSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.benefitBox}>
                <Text style={styles.benefitText}>{currentAd.benefit}</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: benefitSlideAnim,
                transform: [
                  {
                    scale: benefitSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  { backgroundColor: currentAd.color },
                ]}
                onPress={async () => {
                  await sound?.stopAsync();
                  onBookNowPress?.();
                }}
              >
                <Text style={styles.ctaText}>{currentAd.cta}</Text>
                <MaterialCommunityIcons
                  name="arrow-right-bold"
                  size={20}
                  color="white"
                  style={{ marginLeft: 10 }}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Decorative bottom-right elements */}
          <View style={[styles.decorativeCircle, styles.bottomRight, { backgroundColor: currentAd.accentColor }]} />
          <View style={[styles.decorativeLine, styles.lineBottomLeft, { backgroundColor: currentAd.accentColor }]} />
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
                    : 'rgba(0, 0, 0, 0.2)',
                width: index === currentIndex ? 28 : 8,
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.slideCounter}>
        {currentIndex + 1} / {PROMOTIONAL_ADS.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    padding: 8,
  },
  adCard: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 12,
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    zIndex: 0,
    opacity: 0.15,
  },
  topLeft: {
    width: 120,
    height: 120,
    top: -30,
    left: -30,
  },
  bottomRight: {
    width: 100,
    height: 100,
    bottom: -20,
    right: -20,
  },
  decorativeLine: {
    position: 'absolute',
    zIndex: 0,
    opacity: 0.2,
  },
  lineTopRight: {
    width: 80,
    height: 2,
    top: '20%',
    right: 0,
  },
  lineBottomLeft: {
    width: 60,
    height: 2,
    bottom: '25%',
    left: 0,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    zIndex: 2,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
    lineHeight: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  problemSection: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
  },
  problemLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  problemText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    fontWeight: '600',
  },
  solutionSection: {
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
  },
  solutionLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  solutionText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    fontWeight: '600',
  },
  highlightsContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 12,
    flexWrap: 'wrap',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    minWidth: '30%',
  },
  highlightIcon: {
    marginRight: 6,
  },
  highlightText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  benefitBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  benefitText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: 'transparent',
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  } as any,
  slideCounter: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 12,
    letterSpacing: 0.3,
  },
});
