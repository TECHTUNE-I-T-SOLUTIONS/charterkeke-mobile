import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { AdVideoOne } from './AdVideoOne';
import { AdVideoTwo } from './AdVideoTwo';
import { AdVideoThree } from './AdVideoThree';
import { AdVideoFour } from './AdVideoFour';
import { AdVideoFive } from './AdVideoFive';
import { AdVideoSix } from './AdVideoSix';
import { AdVideoSeven } from './AdVideoSeven';

const { width, height } = Dimensions.get('window');

interface AdVideoManagerProps {
  visible: boolean;
  onClose?: () => void;
  onBookNow?: () => void;
  onNavigateToBooking?: () => void;
}

const AD_VIDEOS = [
  AdVideoOne,
  AdVideoTwo,
  AdVideoThree,
  AdVideoFour,
  AdVideoFive,
  AdVideoSix,
  AdVideoSeven,
];

/**
 * AdVideoManager
 * 
 * Shows ONE random ad video per session.
 * - No auto-rotation between videos
 * - Audio loops while video is showing
 * - Audio stops when user dismisses/skips the ad
 * - Next ad appears on next session when ad is triggered again
 * - CRITICAL: Only renders the selected video component to prevent multiple audio instances
 * 
 * Features:
 * - 7 unique video ad campaigns
 * - Each with independent audio (looped)
 * - Full-screen immersive experience
 * - Single ad per session display
 * - Prevents multiple audio tracks from playing simultaneously
 */
export function AdVideoManager({
  visible,
  onClose,
  onBookNow,
  onNavigateToBooking,
}: AdVideoManagerProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(-1);
  const [wasVisibleBefore, setWasVisibleBefore] = useState(false);
  
  // Select a random video ONLY when transitioning from invisible to visible
  useEffect(() => {
    if (visible && !wasVisibleBefore) {
      // Transitioning from hidden to visible - pick a new random ad
      const randomIndex = Math.floor(Math.random() * AD_VIDEOS.length);
      console.log(`[AdVideoManager] Showing ad ${randomIndex + 1} of ${AD_VIDEOS.length}`);
      setSelectedVideoIndex(randomIndex);
      setWasVisibleBefore(true);
    } else if (!visible && wasVisibleBefore) {
      // Transitioning from visible to hidden - reset for next time
      setWasVisibleBefore(false);
      setSelectedVideoIndex(-1);
    }
  }, [visible, wasVisibleBefore]);

  // Don't render anything if not visible or index not selected
  if (!visible || selectedVideoIndex < 0) {
    return null;
  }

  const CurrentVideo = AD_VIDEOS[selectedVideoIndex];

  const handleDismiss = () => {
    console.log('[AdVideoManager] Ad dismissed');
    onClose?.();
  };

  const handleBookNow = () => {
    console.log('[AdVideoManager] CTA button pressed - navigating to booking');
    onNavigateToBooking?.();
    onClose?.();
  };

  return (
    <View style={styles.container}>
      <CurrentVideo
        onSkip={handleDismiss}
        onBookNowPress={handleBookNow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 9999,
  },
});
