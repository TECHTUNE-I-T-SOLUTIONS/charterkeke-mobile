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

interface AdVideoSixProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

export function AdVideoSix({ onBookNowPress, onSkip }: AdVideoSixProps = {}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Play looping background audio
  useEffect(() => {
    const playBackgroundAudio = async () => {
      try {
        const audioFile = require('../assets/promotional-ads/ads-audio (6).mp3');
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
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Shake/energy animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: -5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();

    // Rotating element
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, slideAnim, scaleAnim, shakeAnim, rotateAnim]);

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
        colors={['#dc2626', '#b91c1c', '#991b1b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Energy background elements */}
        <View style={[styles.energyPulse, styles.pulse1]} />
        <View style={[styles.energyPulse, styles.pulse2]} />
        <View style={[styles.energyPulse, styles.pulse3]} />

        {/* Content */}
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header */}
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
            <View style={styles.energyBadge}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={14}
                color="#fbbf24"
              />
              <Text style={styles.energyText}>PEAK ENERGY</Text>
            </View>
          </View>

          {/* Animated Icon */}
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <View style={styles.energyIconContainer}>
              <MaterialCommunityIcons
                name="bike-fast"
                size={80}
                color="#fbbf24"
              />
            </View>
          </Animated.View>

          {/* Main Message */}
          <Animated.View
            style={[
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                  {
                    translateX: shakeAnim,
                  },
                ],
              },
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.mainMessage}>
              Go <Text style={styles.highlightWord}>FASTER</Text>
            </Text>
            <Text style={styles.subMessage}>
              Leave the traffic behind
            </Text>
          </Animated.View>

          {/* Speed Stats */}
          <Animated.View
            style={[
              styles.statsContainer,
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
            <View style={styles.speedStat}>
              <Text style={styles.speedNumber}>3x</Text>
              <Text style={styles.speedLabel}>Faster than buses</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.speedStat}>
              <Text style={styles.speedNumber}>50%</Text>
              <Text style={styles.speedLabel}>Time saved daily</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.speedStat}>
              <Text style={styles.speedNumber}>24/7</Text>
              <Text style={styles.speedLabel}>Always available</Text>
            </View>
          </Animated.View>

          {/* Route Animation */}
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
            }}
          >
            <View style={styles.routeBox}>
              <View style={styles.routeStart}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={24}
                  color="#10b981"
                />
                <Text style={styles.routeLabel}>Your Location</Text>
              </View>
              <View style={styles.routePath}>
                <View style={styles.pathDot} />
                <View style={styles.pathDot} />
                <View style={styles.pathDot} />
              </View>
              <View style={styles.routeEnd}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={24}
                  color="#dc2626"
                />
                <Text style={styles.routeLabel}>Destination</Text>
              </View>
            </View>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
          >
            <Text style={styles.tagline}>
              Kekes beat traffic. Every single time.
            </Text>
          </Animated.View>

          {/* CTA Buttons */}
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
              style={styles.primaryCTA}
              onPress={handleBookNow}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="speedometer"
                size={20}
                color="#dc2626"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.ctaTextPrimary}>GO FASTER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCTA}
              onPress={handleDismiss}
            >
              <Text style={styles.ctaTextSecondary}>Not Right Now</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Floating speed lines */}
        <View style={[styles.speedLine, styles.line1]} />
        <View style={[styles.speedLine, styles.line2]} />
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
  energyPulse: {
    position: 'absolute',
    borderRadius: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pulse1: {
    width: 250,
    height: 250,
    top: '-10%',
    left: '-10%',
  },
  pulse2: {
    width: 200,
    height: 200,
    bottom: '5%',
    right: '-5%',
  },
  pulse3: {
    width: 150,
    height: 150,
    top: '40%',
    right: '-20%',
  },
  contentWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  energyText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  energyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  mainMessage: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  highlightWord: {
    color: '#fbbf24',
    fontStyle: 'italic',
  },
  subMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  speedStat: {
    flex: 1,
    alignItems: 'center',
  },
  speedNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 4,
  },
  speedLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  routeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  routeStart: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  routePath: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pathDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.5)',
  },
  routeLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  primaryCTA: {
    width: width - 48,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 12,
  },
  ctaTextPrimary: {
    color: '#dc2626',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  secondaryCTA: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaTextSecondary: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  speedLine: {
    position: 'absolute',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    height: 2,
  },
  line1: {
    width: 200,
    top: '25%',
    left: '-20%',
  },
  line2: {
    width: 150,
    bottom: '30%',
    right: '-15%',
  },
});
