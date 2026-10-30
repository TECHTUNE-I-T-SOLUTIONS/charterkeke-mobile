import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BRAND_ORANGE = '#FF9101';

interface ProximityAlertModalProps {
  visible: boolean;
  distanceKm: number;
  type: 'pickup' | 'dropoff';
  onClose: () => void;
}

export const ProximityAlertModal: React.FC<ProximityAlertModalProps> = ({
  visible,
  distanceKm,
  type,
  onClose,
}) => {
  const isPickup = type === 'pickup';
  const isGpsUnavailable = distanceKm === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={isGpsUnavailable ? 'crosshairs-question' : (isPickup ? 'map-marker-alert' : 'map-marker-check')}
              size={38}
              color={BRAND_ORANGE}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isGpsUnavailable ? 'GPS Unavailable' : (isPickup ? 'Not at Pickup Location' : 'Not at Dropoff Location')}
          </Text>

          {/* Distance badge - only show if not GPS unavailable */}
          {!isGpsUnavailable && (
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={BRAND_ORANGE} />
              <Text style={styles.distanceText}>{distanceKm.toFixed(2)} km away</Text>
            </View>
          )}

          {/* Message */}
          <Text style={styles.message}>
            {isGpsUnavailable
              ? 'Unable to detect your current GPS location. Please check your location settings and try again.'
              : (isPickup
                  ? `You are still ${distanceKm.toFixed(1)} km from the passenger's pickup point. Please drive closer before notifying the rider.`
                  : `You are still ${distanceKm.toFixed(1)} km from the dropoff location. Make sure you and the rider have reached the destination before completing the trip.`)}
          </Text>

          {/* Dismiss */}
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Understood, Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1A1A1A',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,145,1,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 18,
      },
      android: { elevation: 14 },
    }),
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,145,1,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,145,1,0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,145,1,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  distanceText: {
    color: BRAND_ORANGE,
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontSize: 13.5,
    color: '#C9CDD4',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  button: {
    width: '100%',
    backgroundColor: BRAND_ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
