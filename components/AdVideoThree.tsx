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

const { width, height } = Dimensions.get('window');

interface AdVideoThreeProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

export function AdVideoThree({ onBookNowPress, onSkip }: AdVideoThreeProps = {}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // No audio - ads are now silent for session resumption flow
  // Entrance animations with bouncing effects
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
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -20,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();

    // Continuous rotation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, bounceAnim, slideAnim, rotateAnim]);

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={onSkip}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="close"
          size={24}
          color="#ffffff"
        />
      </TouchableOpacity>

      <LinearGradient
        colors={['#0ea5e9', '#06b6d4', '#0891b2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Background Grid Pattern */}
        <View style={styles.gridPattern}>
          {[...Array(9)].map((_, i) => (
            <View key={i} style={styles.gridItem} />
          ))}
        </View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Rotating Center Icon */}
          <Animated.View
            style={[
              styles.centerIconContainer,
              {
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  {
                    translateY: bounceAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.centerIcon}>
              <MaterialCommunityIcons
                name="car-door"
                size={64}
                color="#ffffff"
              />
            </View>
          </Animated.View>

          {/* Main Title with animated entrance */}
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
            <Text style={styles.mainTitle}>
              Your <Text style={styles.highlightGold}>Lagos Lifeline</Text>
            </Text>
            <Text style={styles.subtitle}>
              Smart transport for smart Lagosians
            </Text>
          </Animated.View>

          {/* Feature Cards Grid */}
          <Animated.View
            style={[
              styles.cardsGrid,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Card 1 */}
            <View style={[styles.featureCard, styles.card1]}>
              <View style={styles.cardIconBg}>
                <MaterialCommunityIcons
                  name="alarm-check"
                  size={28}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.cardTitle}>No Waiting</Text>
              <Text style={styles.cardDesc}>Get pickup in minutes</Text>
            </View>

            {/* Card 2 */}
            <View style={[styles.featureCard, styles.card2]}>
              <View style={styles.cardIconBg}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={28}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.cardTitle}>Better Rates</Text>
              <Text style={styles.cardDesc}>Save up to 40% daily</Text>
            </View>

            {/* Card 3 */}
            <View style={[styles.featureCard, styles.card3]}>
              <View style={styles.cardIconBg}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={28}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.cardTitle}>Extra Safe</Text>
              <Text style={styles.cardDesc}>Verified & rated drivers</Text>
            </View>

            {/* Card 4 */}
            <View style={[styles.featureCard, styles.card4]}>
              <View style={styles.cardIconBg}>
                <MaterialCommunityIcons
                  name="map-check"
                  size={28}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.cardTitle}>All Routes</Text>
              <Text style={styles.cardDesc}>500+ Lagos locations</Text>
            </View>
          </Animated.View>

          {/* Value Proposition */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.valueBox}>
              <Text style={styles.valueTitle}>Why 50K+ riders trust us</Text>
              <View style={styles.valueBullet}>
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color="#10b981"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.bulletText}>
                  Direct payment to drivers
                </Text>
              </View>
              <View style={styles.valueBullet}>
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color="#10b981"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.bulletText}>Live tracking & updates</Text>
              </View>
              <View style={styles.valueBullet}>
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color="#10b981"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.bulletText}>24/7 customer support</Text>
              </View>
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onBookNowPress}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaButtonText}>START RIDING NOW</Text>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={20}
                color="#0ea5e9"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Decorative Floating Shapes */}
        <Animated.View
          style={[
            styles.floatingShape,
            styles.shape1,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="navigation"
            size={40}
            color="rgba(255, 255, 255, 0.1)"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingShape,
            styles.shape2,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={40}
            color="rgba(255, 255, 255, 0.08)"
          />
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
    backgroundColor: '#000',
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
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.05,
    zIndex: 0,
  },
  gridItem: {
    width: '33.33%',
    height: height / 3,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerIconContainer: {
    marginBottom: 20,
  },
  centerIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 50,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  highlightGold: {
    color: '#fbbf24',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  featureCard: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  card1: {
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  card2: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  card3: {
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    borderColor: 'rgba(236, 72, 153, 0.5)',
  },
  card4: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  valueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  valueBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  ctaButton: {
    width: width - 40,
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
  },
  ctaButtonText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  floatingShape: {
    position: 'absolute',
    zIndex: 2,
  },
  shape1: {
    top: '20%',
    right: '5%',
  },
  shape2: {
    bottom: '25%',
    left: '5%',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
