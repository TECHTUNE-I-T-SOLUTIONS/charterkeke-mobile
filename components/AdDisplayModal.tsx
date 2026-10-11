import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PromotionalAdCarousel } from './PromotionalAdCarousel';

const { width, height } = Dimensions.get('window');

interface AdDisplayModalProps {
  visible: boolean;
  onClose: () => void;
  onBookNow?: () => void;
}

export function AdDisplayModal({
  visible,
  onClose,
  onBookNow,
}: AdDisplayModalProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleClose = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      hardwareAccelerated
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={0.8}
          onPress={handleClose}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: slideAnim,
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonInner}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="white"
                />
              </View>
            </TouchableOpacity>

            {/* Ad Carousel */}
            <View style={styles.carouselWrapper}>
              <PromotionalAdCarousel
                onBookNowPress={
                  onBookNow
                    ? () => {
                        handleClose();
                        setTimeout(onBookNow, 300);
                      }
                    : undefined
                }
              />
            </View>

            {/* Dismiss hint */}
            <View style={styles.dismissHint}>
              <MaterialCommunityIcons
                name="gesture-swipe-down"
                size={16}
                color="rgba(255, 255, 255, 0.6)"
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 16 : 12,
    right: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  dismissHint: {
    alignItems: 'center',
    paddingBottom: 12,
    opacity: 0.6,
  },
});
