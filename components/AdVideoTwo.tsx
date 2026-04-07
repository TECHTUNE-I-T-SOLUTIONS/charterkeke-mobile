import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface AdVideoTwoProps {
  onBookNowPress?: () => void;
}

export function AdVideoTwo({ onBookNowPress }: AdVideoTwoProps = {}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Play looping background audio throughout the video
  useEffect(() => {
    const playBackgroundAudio = async () => {
      try {
        const audioFile = require('../assets/promotional-ads/ads-audio (2).mp3');
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile, {
          isLooping: true, // Loop audio throughout entire video
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

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Looping pulse animation
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulsing.start();

    return () => pulsing.stop();
  }, [fadeAnim, pulseAnim, slideAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f97316', '#f57624', '#ea580c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Background decorative shapes */}
        <View style={[styles.bgCircle, styles.circle1]} />
        <View style={[styles.bgCircle, styles.circle2]} />
        <View style={[styles.bgCircle, styles.circle3]} />

        {/* Main Content */}
        <Animated.View
          style={[
            styles.contentContainer,
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
          {/* Top Icon Section with Pulse */}
          <Animated.View
            style={[
              styles.iconSection,
              {
                transform: [
                  {
                    scale: pulseAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.topIconBadge}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={56}
                color="#ffffff"
              />
            </View>
            <Text style={styles.topSubtitle}>LIGHTNING FAST</Text>
          </Animated.View>

          {/* Main Headline with slide animation */}
          <Animated.View
            style={{
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: fadeAnim,
            }}
          >
            <Text style={styles.headline}>
              Where Every Minute <Text style={styles.highlightText}>Counts</Text>
            </Text>
          </Animated.View>

          {/* Stats Grid with staggered animation */}
          <Animated.View
            style={[
              styles.statsGrid,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="clock-fast"
                size={32}
                color="#ff6b6b"
              />
              <Text style={styles.statNumber}>8min</Text>
              <Text style={styles.statLabel}>Avg Pickup</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="cash-fast"
                size={32}
                color="#10b981"
              />
              <Text style={styles.statNumber}>40%</Text>
              <Text style={styles.statLabel}>Cheaper</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="heart"
                size={32}
                color="#ec4899"
              />
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Satisfied</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="map-marker"
                size={32}
                color="#0ea5e9"
              />
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Routes</Text>
            </View>
          </Animated.View>

          {/* Feature Pills */}
          <Animated.View
            style={[
              styles.featuresContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featurePill}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.featureText}>Verified Drivers</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.featureText}>Real-Time Tracking</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.featureText}>Safe & Secure</Text>
            </View>
          </Animated.View>

          {/* CTA Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0.8, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.mainCTA}
              onPress={onBookNowPress}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>BOOK NOW</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={24}
                color="#f97316"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>

            <Text style={styles.trustText}>
              ✓ Trusted by 50,000+ riders daily
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Floating decorative elements */}
        <View style={[styles.floatingElement, styles.float1]}>
          <MaterialCommunityIcons
            name="map-marker"
            size={40}
            color="rgba(255, 255, 255, 0.1)"
          />
        </View>
        <View style={[styles.floatingElement, styles.float2]}>
          <MaterialCommunityIcons
            name="speedometer"
            size={40}
            color="rgba(255, 255, 255, 0.08)"
          />
        </View>
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
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  circle1: {
    width: 250,
    height: 250,
    top: -50,
    left: -50,
    backgroundColor: '#ffffff',
  },
  circle2: {
    width: 180,
    height: 180,
    bottom: 100,
    right: -50,
    backgroundColor: '#ffffff',
  },
  circle3: {
    width: 150,
    height: 150,
    top: '50%',
    left: '-10%',
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  topIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  topSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  highlightText: {
    color: '#ffd700',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 32,
    width: '100%',
  },
  statBox: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 28,
    gap: 10,
  },
  featurePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  featureText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mainCTA: {
    width: width - 48,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 16,
  },
  ctaText: {
    color: '#f97316',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  trustText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  floatingElement: {
    position: 'absolute',
    zIndex: 1,
  },
  float1: {
    top: '15%',
    right: '10%',
  },
  float2: {
    bottom: '20%',
    left: '8%',
  },
});
