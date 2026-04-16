import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Animated,
} from 'react-native';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface LiveLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  userId: string;
  userName?: string;
  isLive?: boolean;
}

interface LocationMapModalProps {
  visible: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  title?: string;
  currentUserLocation?: LiveLocationData | null;
  otherUserLocation?: LiveLocationData | null;
  currentUserId?: string;
  onStartLiveTracking?: () => void;
  onStopLiveTracking?: () => void;
  isTrackingLive?: boolean;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  visible,
  latitude,
  longitude,
  onClose,
  title = 'Shared Location',
  currentUserLocation,
  otherUserLocation,
  currentUserId,
  onStartLiveTracking,
  onStopLiveTracking,
  isTrackingLive = false,
}) => {
  const { theme, mode } = useTheme();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;
  const mapRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulsing animation for live markers
  useEffect(() => {
    if (isTrackingLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isTrackingLive, pulseAnim]);

  const handleClose = () => {
    if (onStopLiveTracking && isTrackingLive) {
      onStopLiveTracking();
    }
    onClose();
  };

  const handleToggleLiveTracking = () => {
    if (isTrackingLive) {
      onStopLiveTracking?.();
    } else {
      onStartLiveTracking?.();
    }
  };

  // Determine center coordinates (use current user location if available and live tracking is on)
  const centerLat = isTrackingLive && currentUserLocation ? currentUserLocation.latitude : latitude;
  const centerLon = isTrackingLive && currentUserLocation ? currentUserLocation.longitude : longitude;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {title}
            </Text>
            {isTrackingLive && (
              <View style={[styles.liveIndicator, { backgroundColor: '#FF4444' }]}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>Live</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapboxMap
            ref={mapRef}
            latitude={centerLat}
            longitude={centerLon}
            zoom={16}
            cameraCenterCoordinate={[centerLon, centerLat]}
            cameraZoom={16}
            cameraAnimationDuration={500}
          >
            {/* Static location marker */}
            <MapboxMarker
              id="location-marker"
              coordinate={[longitude, latitude]}
              title="Shared Location"
              description={`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
              color="#FF9203"
            />

            {/* Current user live location */}
            {isTrackingLive && currentUserLocation && (
              <MapboxMarker
                id="current-user-location"
                coordinate={[currentUserLocation.longitude, currentUserLocation.latitude]}
                title="Your Location"
                description="Live"
                color="#4CAF50"
              />
            )}

            {/* Other user live location */}
            {isTrackingLive && otherUserLocation && (
              <MapboxMarker
                id="other-user-location"
                coordinate={[otherUserLocation.longitude, otherUserLocation.latitude]}
                title={otherUserLocation.userName || 'Their Location'}
                description="Live"
                color="#2196F3"
              />
            )}
          </MapboxMap>
        </View>

        {/* Live Tracking Controls */}
        <View style={[styles.controlsContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleToggleLiveTracking}
            style={[
              styles.liveTrackingButton,
              isTrackingLive
                ? { backgroundColor: '#FF4444' }
                : { backgroundColor: colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name={isTrackingLive ? 'pause-circle' : 'play-circle'}
              size={20}
              color={colors.primaryForeground}
              style={{ marginRight: scale(8) }}
            />
            <Text style={[styles.liveTrackingButtonText, { color: colors.primaryForeground }]}>
              {isTrackingLive ? 'Stop Live Tracking' : 'Start Live Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
          {/* Initial shared location */}
          <View style={styles.locationSection}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color="#FF9203"
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Shared Location
              </Text>
            </View>

            <View style={styles.infoContent}>
              <View style={styles.coordsText}>
                <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                  Latitude
                </Text>
                <Text
                  style={[styles.coordsValue, { color: colors.text }]}
                  selectable={true}
                >
                  {latitude.toFixed(6)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.coordsText}>
                <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                  Longitude
                </Text>
                <Text
                  style={[styles.coordsValue, { color: colors.text }]}
                  selectable={true}
                >
                  {longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          {/* Live locations */}
          {isTrackingLive && (
            <>
              {currentUserLocation && (
                <View style={styles.locationSection}>
                  <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                    <View style={[styles.liveIndicator, { backgroundColor: '#4CAF50' }]}>
                      <View style={styles.liveIndicatorDot} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Your Live Location
                    </Text>
                  </View>

                  <View style={styles.infoContent}>
                    <View style={styles.coordsText}>
                      <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                        Latitude
                      </Text>
                      <Text
                        style={[styles.coordsValue, { color: colors.text }]}
                        selectable={true}
                      >
                        {currentUserLocation.latitude.toFixed(6)}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.coordsText}>
                      <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                        Longitude
                      </Text>
                      <Text
                        style={[styles.coordsValue, { color: colors.text }]}
                        selectable={true}
                      >
                        {currentUserLocation.longitude.toFixed(6)}
                      </Text>
                    </View>

                    {currentUserLocation.accuracy && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.coordsText}>
                          <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                            Accuracy
                          </Text>
                          <Text style={[styles.coordsValue, { color: colors.text }]}>
                            ±{currentUserLocation.accuracy.toFixed(1)}m
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {otherUserLocation && (
                <View style={styles.locationSection}>
                  <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                    <View style={[styles.liveIndicator, { backgroundColor: '#2196F3' }]}>
                      <View style={styles.liveIndicatorDot} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {otherUserLocation.userName || 'Their Live Location'}
                    </Text>
                  </View>

                  <View style={styles.infoContent}>
                    <View style={styles.coordsText}>
                      <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                        Latitude
                      </Text>
                      <Text
                        style={[styles.coordsValue, { color: colors.text }]}
                        selectable={true}
                      >
                        {otherUserLocation.latitude.toFixed(6)}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.coordsText}>
                      <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                        Longitude
                      </Text>
                      <Text
                        style={[styles.coordsValue, { color: colors.text }]}
                        selectable={true}
                      >
                        {otherUserLocation.longitude.toFixed(6)}
                      </Text>
                    </View>

                    {otherUserLocation.accuracy && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.coordsText}>
                          <Text style={[styles.coordsLabel, { color: colors.textSecondary }]}>
                            Accuracy
                          </Text>
                          <Text style={[styles.coordsValue, { color: colors.text }]}>
                            ±{otherUserLocation.accuracy.toFixed(1)}m
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Close Button */}
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButtonLarge, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.closeButtonText, { color: colors.primaryForeground }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveIndicatorText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: scale(6),
  },
  mapContainer: {
    flex: 1,
    marginBottom: verticalScale(4),
  },
  controlsContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
  },
  liveTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
  },
  liveTrackingButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  infoContainer: {
    borderTopWidth: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    maxHeight: '35%',
  },
  locationSection: {
    marginBottom: verticalScale(12),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: verticalScale(8),
    marginBottom: verticalScale(8),
    borderBottomWidth: 1,
    gap: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(4),
  },
  coordsText: {
    marginLeft: scale(8),
    flex: 1,
  },
  coordsLabel: {
    fontSize: moderateScale(11),
    marginBottom: verticalScale(2),
  },
  coordsValue: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: verticalScale(8),
  },
  footer: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  closeButtonLarge: {
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});
