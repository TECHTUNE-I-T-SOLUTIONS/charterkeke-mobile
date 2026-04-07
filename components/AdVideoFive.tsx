import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface AdVideoFiveProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

export function AdVideoFive({ onBookNowPress, onSkip }: AdVideoFiveProps = {}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // Play looping background audio
  useEffect(() => {
    const playBackgroundAudio = async () => {
      try {
        const audioFile = require('../assets/promotional-ads/ads-audio (5).mp3');
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

  // Animations
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Floating animations for elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -20,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 20,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, floatAnim1, floatAnim2, scaleAnim]);

  const handleDismiss = async () => {
    await sound?.stopAsync();
    onSkip?.();
  };

  const handleBookNow = async () => {
    await sound?.stopAsync();
    onBookNowPress?.();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7c3aed', '#6d28d9', '#5b21b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Background premium pattern */}
        <View style={styles.patternOverlay} />

        {/* Floating premium shapes */}
        <Animated.View
          style={[
            styles.floatingShape,
            styles.shape1,
            { transform: [{ translateY: floatAnim1 }] },
          ]}
        >
          <View style={styles.diamond} />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingShape,
            styles.shape2,
            { transform: [{ translateY: floatAnim2 }] },
          ]}
        >
          <View style={styles.diamond} />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* SECTION 1: TOP - Header */}
          <View style={styles.topSection}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={28}
                  color="rgba(255, 255, 255, 0.9)"
                />
              </TouchableOpacity>
              <View style={styles.premiumBadge}>
                <MaterialCommunityIcons
                  name="crown"
                  size={14}
                  color="#fbbf24"
                />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            </View>
          </View>

          {/* SECTION 2: MIDDLE - Main content */}
          <View style={styles.middleSection}>
            {/* Icon showcase */}
            <Animated.View
              style={{
                transform: [{ translateY: floatAnim1 }],
              }}
            >
              <View style={styles.iconShowcase}>
                <MaterialCommunityIcons
                  name="car-sports"
                  size={80}
                  color="#ffffff"
                />
              </View>
            </Animated.View>

            {/* Main headline */}
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                ],
                opacity: fadeAnim,
              }}
            >
              <Text style={styles.mainHeadline}>
                Ride with <Text style={styles.highlightText}>Pride</Text>
              </Text>
              <Text style={styles.subheading}>
                Trusted by Lagos professionals
              </Text>
            </Animated.View>

            {/* Premium features grid */}
            <Animated.View
              style={[
                styles.featuresGrid,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      scale: scaleAnim,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.featureBox}>
                <View style={styles.featureIconBg}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={28}
                    color="#7c3aed"
                  />
                </View>
                <Text style={styles.featureLabel}>Verified</Text>
                <Text style={styles.featureDesc}>Safe drivers</Text>
              </View>

              <View style={styles.featureBox}>
                <View style={styles.featureIconBg}>
                  <MaterialCommunityIcons
                    name="star"
                    size={28}
                    color="#7c3aed"
                  />
                </View>
                <Text style={styles.featureLabel}>Rated</Text>
                <Text style={styles.featureDesc}>4.9/5 avg</Text>
              </View>

              <View style={styles.featureBox}>
                <View style={styles.featureIconBg}>
                  <MaterialCommunityIcons
                    name="clock-check"
                    size={28}
                    color="#7c3aed"
                  />
                </View>
                <Text style={styles.featureLabel}>On Time</Text>
                <Text style={styles.featureDesc}>Always prompt</Text>
              </View>

              <View style={styles.featureBox}>
                <View style={styles.featureIconBg}>
                  <MaterialCommunityIcons
                    name="heart"
                    size={28}
                    color="#7c3aed"
                  />
                </View>
                <Text style={styles.featureLabel}>Support</Text>
                <Text style={styles.featureDesc}>24/7 help</Text>
              </View>
            </Animated.View>

            {/* Testimonial */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  },
                ],
                width: '100%',
              }}
            >
              <View style={styles.testimonialBox}>
                <View style={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name="star"
                      size={16}
                      color="#fbbf24"
                      style={{ marginHorizontal: 2 }}
                    />
                  ))}
                </View>
                <Text style={styles.testimonialText}>
                  "Best keke experience in Lagos. Professional & courteous drivers!"
                </Text>
                <Text style={styles.testimonialAuthor}>— Aisha, Lagos Island</Text>
              </View>
            </Animated.View>
          </View>

          {/* SECTION 3: BOTTOM - CTA Buttons */}
          <View style={styles.bottomSection}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0.85, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
                width: '100%',
              }}
            >
              <TouchableOpacity
                style={styles.primaryCTA}
                onPress={handleBookNow}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaTextPrimary}>BOOK PREMIUM RIDE</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#7c3aed"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCTA}
                onPress={handleDismiss}
              >
                <Text style={styles.ctaTextSecondary}>Not Interested</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    zIndex: 0,
  },
  floatingShape: {
    position: 'absolute',
    zIndex: 1,
  },
  shape1: {
    top: '15%',
    right: '10%',
  },
  shape2: {
    bottom: '25%',
    left: '10%',
  },
  diamond: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    transform: [{ rotate: '45deg' }],
    borderRadius: 4,
  },
  topSection: {
    width: '100%',
    minHeight: 50,
    justifyContent: 'flex-start',
  },
  middleSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  premiumText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  iconShowcase: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 16,
  },
  mainHeadline: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 6,
  },
  highlightText: {
    color: '#fbbf24',
    fontStyle: 'italic',
  },
  subheading: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 14,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  featureBox: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featureIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  testimonialBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  testimonialText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 7,
    lineHeight: 18,
  },
  testimonialAuthor: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  primaryCTA: {
    width: width - 32,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 10,
  },
  ctaTextPrimary: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  secondaryCTA: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaTextSecondary: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
});
