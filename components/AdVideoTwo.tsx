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

const { width, height } = Dimensions.get('window');

interface AdVideoTwoProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

export function AdVideoTwo({ onBookNowPress, onSkip }: AdVideoTwoProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // No audio - ads are now silent for session resumption flow
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
                size={44}
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
                size={24}
                color="#ff6b6b"
              />
              <Text style={styles.statNumber}>8min</Text>
              <Text style={styles.statLabel}>Avg Pickup</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="cash-fast"
                size={24}
                color="#10b981"
              />
              <Text style={styles.statNumber}>40%</Text>
              <Text style={styles.statLabel}>Cheaper</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="heart"
                size={24}
                color="#ec4899"
              />
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Satisfied</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
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
                size={16}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.featureText}>Verified Drivers</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.featureText}>Real-Time Tracking</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
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
              onPress={async () => {
                // if (sound) {
                //   await sound.stopAsync().catch(() => {});
                //   await sound.unloadAsync().catch(() => {});
                // }
                onBookNowPress?.();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>BOOK NOW</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#f97316"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <Text style={styles.trustText}>
              ✓ Trusted by 50,000+ riders daily
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Skip Button - Top Right */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={async () => {
            // if (sound) {
            //   await sound.stopAsync().catch(() => {});
            //   await sound.unloadAsync().catch(() => {});
            // }
            onSkip?.();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={28}
            color="rgba(255, 255, 255, 0.9)"
          />
        </TouchableOpacity>

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
    maxHeight: height * 0.95,
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingTop: 48,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
    flexShrink: 1,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 6,
  },
  topIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  topSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 10,
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
    marginBottom: 8,
    width: '100%',
    gap: 4,
  },
  statBox: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginVertical: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 8,
    gap: 5,
  },
  featurePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  featureText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  mainCTA: {
    width: width - 40,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 4,
  },
  ctaText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  trustText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
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
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});
