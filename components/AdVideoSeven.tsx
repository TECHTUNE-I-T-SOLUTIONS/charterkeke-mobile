import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface AdVideoSevenProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

const testimonials = [
  {
    name: 'Chioma',
    role: 'Nurse',
    text: 'Gets me to work on time, every day!',
    rating: 5,
    color: '#10b981',
  },
  {
    name: 'David',
    role: 'Student',
    text: 'Affordable and reliable. No more taxi stress!',
    rating: 5,
    color: '#0ea5e9',
  },
  {
    name: 'Zainab',
    role: 'Entrepreneur',
    text: 'Safe drivers, clean rides. Highly recommended!',
    rating: 5,
    color: '#ec4899',
  },
];

export function AdVideoSeven({ onBookNowPress, onSkip }: AdVideoSevenProps = {}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // Play looping background audio
  useEffect(() => {
    const playBackgroundAudio = async () => {
      try {
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

    // Pulse animation for hearts
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, scaleAnim, pulseAnim]);

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
        colors={['#f59e0b', '#d97706', '#b45309']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Background love pattern */}
        <View style={[styles.bgHearts, styles.heart1]}>
          <MaterialCommunityIcons
            name="heart"
            size={60}
            color="rgba(255, 255, 255, 0.08)"
          />
        </View>
        <View style={[styles.bgHearts, styles.heart2]}>
          <MaterialCommunityIcons
            name="heart"
            size={40}
            color="rgba(255, 255, 255, 0.06)"
          />
        </View>

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
            <View style={styles.trustBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={14}
                color="#10b981"
              />
              <Text style={styles.trustText}>TRUSTED</Text>
            </View>
          </View>

          {/* Pulsing heart icon */}
          <Animated.View
            style={[
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.heartIcon}>
              <MaterialCommunityIcons
                name="heart"
                size={70}
                color="#ec4899"
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
              Loved by <Text style={styles.highlight}>50K+ Riders</Text>
            </Text>
            <Text style={styles.subHeadline}>
              Join the community that loves KEKE
            </Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            style={[
              styles.statsBox,
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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Happy Riders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9★</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </Animated.View>

          {/* Testimonials */}
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
            <Text style={styles.testimonialsTitle}>What Riders Say</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.testimonialScroll}
              scrollEnabled={false}
            >
              {testimonials.map((testimonial, index) => (
                <View key={index} style={[styles.testimonialCard, { borderLeftColor: testimonial.color }]}>
                  <View style={styles.stars}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <MaterialCommunityIcons
                        key={i}
                        name="star"
                        size={12}
                        color="#fbbf24"
                      />
                    ))}
                  </View>
                  <Text style={styles.testimonialText}>{testimonial.text}</Text>
                  <View style={styles.testimonialAuthor}>
                    <View style={[styles.avatarCircle, { backgroundColor: testimonial.color }]}>
                      <Text style={styles.avatarText}>
                        {testimonial.name[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.authorName}>{testimonial.name}</Text>
                      <Text style={styles.authorRole}>{testimonial.role}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Community Message */}
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
          >
            <View style={styles.communityBox}>
              <MaterialCommunityIcons
                name="handshake"
                size={28}
                color="#ffffff"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.communityText}>
                Join thousands of smart Lagos residents
              </Text>
            </View>
          </Animated.View>

          {/* CTA Buttons */}
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
            }}
          >
            <TouchableOpacity
              style={styles.primaryCTA}
              onPress={handleBookNow}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>JOIN THE COMMUNITY</Text>
              <MaterialCommunityIcons
                name="heart"
                size={20}
                color="#f59e0b"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCTA}
              onPress={handleDismiss}
            >
              <Text style={styles.ctaSecondary}>Maybe Later</Text>
            </TouchableOpacity>
          </Animated.View>
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
  bgHearts: {
    position: 'absolute',
    zIndex: 0,
  },
  heart1: {
    top: '10%',
    right: '5%',
  },
  heart2: {
    bottom: '15%',
    left: '-5%',
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
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  trustText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heartIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  mainHeadline: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 8,
  },
  highlight: {
    color: '#fbbf24',
    fontStyle: 'italic',
  },
  subHeadline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  statsBox: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  testimonialsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testimonialScroll: {
    marginBottom: 20,
  },
  testimonialCard: {
    width: width - 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 0,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  testimonialText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 10,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  authorRole: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  communityBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  communityText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
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
  ctaText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryCTA: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaSecondary: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
});
