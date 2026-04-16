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

interface AdVideoFourProps {
  onBookNowPress?: () => void;
  onSkip?: () => void;
}

export function AdVideoFour({ onBookNowPress, onSkip }: AdVideoFourProps = {}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // No audio - ads are now silent for session resumption flow
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

    // Continuous bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotating icons
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, slideAnim, scaleAnim, bounceAnim, rotateAnim]);

  const handleDismiss = async () => {
    // await sound?.stopAsync();
    onSkip?.();
  };

  const handleBookNow = async () => {
    // await sound?.stopAsync();
    onBookNowPress?.();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Background elements */}
        <View style={[styles.bgShape, styles.shape1]} />
        <View style={[styles.bgShape, styles.shape2]} />
        <View style={[styles.bgShape, styles.shape3]} />

        {/* Main Content */}
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
              <Text style={styles.adLabel}>SPONSORED</Text>
            </View>
          </View>

          {/* SECTION 2: MIDDLE - Main content */}
          <View style={styles.middleSection}>
            {/* Bouncing Icon Section */}
            <Animated.View
              style={[
                styles.iconSection,
                {
                  transform: [{ translateY: bounceAnim }],
                },
              ]}
            >
              <View style={styles.megaIcon}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={72}
                  color="#ffffff"
                />
              </View>
            </Animated.View>

            {/* Main Message */}
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
              <Text style={styles.mainText}>
                Keep More Money
              </Text>
              <Text style={styles.subText}>
                Save <Text style={styles.highlight}>₦500+</Text> per ride
              </Text>
            </Animated.View>

            {/* Comparison Cards */}
            <Animated.View
              style={[
                styles.comparisonContainer,
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
              {/* Uber/Bolt Card */}
              <View style={[styles.compCard, styles.expensiveCard]}>
                <Text style={styles.cardLabel}>Other Rides</Text>
                <View style={styles.priceTag}>
                  <Text style={styles.oldPrice}>₦2,500</Text>
                </View>
                <Text style={styles.cardDescSmall}>2km ride</Text>
              </View>

              {/* VS Badge */}
              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* KEKE Card */}
              <View style={[styles.compCard, styles.affordableCard]}>
                <Text style={styles.cardLabel}>CHARTER KEKE</Text>
                <View style={styles.priceTagGreen}>
                  <Text style={styles.newPrice}>₦1,500</Text>
                </View>
                <View style={styles.savingsBanner}>
                  <MaterialCommunityIcons
                    name="star"
                    size={14}
                    color="#fbbf24"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.savingsText}>Save ₦1,000!</Text>
                </View>
              </View>
            </Animated.View>

            {/* Feature List */}
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
              <View style={styles.featuresList}>
                <View style={styles.featureRow}>
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#10b981"
                    />
                  </View>
                  <Text style={styles.featureText}>Direct to driver (no app fee)</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#10b981"
                    />
                  </View>
                  <Text style={styles.featureText}>Transparent pricing always</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#10b981"
                    />
                  </View>
                  <Text style={styles.featureText}>Ride 3x more with same budget</Text>
                </View>
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
                      inputRange: [0.8, 1],
                      outputRange: [0.9, 1],
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
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={20}
                  color="#10b981"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.ctaTextPrimary}>SAVE NOW</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCTA}
                onPress={handleDismiss}
              >
                <Text style={styles.ctaTextSecondary}>Maybe Later</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Floating coins animation */}
        <Animated.View
          style={[
            styles.floatingCoin,
            styles.coin1,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={32}
            color="rgba(255, 215, 0, 0.2)"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingCoin,
            styles.coin2,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={24}
            color="rgba(255, 215, 0, 0.15)"
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
  bgShape: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.12,
  },
  shape1: {
    width: 200,
    height: 200,
    top: -50,
    left: -30,
    backgroundColor: '#ffffff',
  },
  shape2: {
    width: 150,
    height: 150,
    bottom: 80,
    right: -40,
    backgroundColor: '#ffffff',
  },
  shape3: {
    width: 100,
    height: 100,
    top: '50%',
    left: '-10%',
    backgroundColor: '#ffffff',
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
    padding: 25,
  },
  adLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  iconSection: {
    marginBottom: 12,
  },
  megaIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  mainText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 14,
  },
  highlight: {
    color: '#fbbf24',
    fontWeight: '900',
    fontSize: 18,
  },
  comparisonContainer: {
    width: '100%',
    marginBottom: 14,
  },
  compCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 9,
    borderWidth: 1,
  },
  expensiveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  affordableCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardDescSmall: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  priceTag: {
    marginVertical: 6,
  },
  oldPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  priceTagGreen: {
    marginVertical: 6,
  },
  newPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fbbf24',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  vsBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  vsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  featuresList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  primaryCTA: {
    width: width - 40,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
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
    marginBottom: 10,
  },
  ctaTextPrimary: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryCTA: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaTextSecondary: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingCoin: {
    position: 'absolute',
    opacity: 0.15,
  },
  coin1: {
    top: '20%',
    right: '8%',
  },
  coin2: {
    bottom: '30%',
    left: '8%',
  },
});
