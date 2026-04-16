import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { Message } from '@/types';
import { COLORS } from '@/utils/colors';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LocationMapModal } from '@/components/LocationMapModal';
import * as Location from 'expo-location';
import { locationService } from '@/services/location';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  isRider?: boolean;
  chatId?: string;
  currentUserId?: string;
  onLocationShare?: (location: any) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwnMessage,
  isRider = true,
  chatId,
  currentUserId,
  onLocationShare,
}) => {
  const { theme, mode } = useTheme();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<any>(null);
  const [otherUserLocation, setOtherUserLocation] = useState<any>(null);
  const [isTrackingLive, setIsTrackingLive] = useState(false);
  const locationWatchRef = useRef<(() => void) | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Start live location tracking
  const startLiveTracking = async () => {
    try {
      // Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[ChatMessage] Location permission not granted');
        showLocationPermissionAlert();
        return;
      }

      setIsTrackingLive(true);

      // Start watching user's own location
      const unwatch = await locationService.watchLocation((location) => {
        setCurrentUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          userId: currentUserId,
          isLive: true,
        });

        // Share location via callback
        if (onLocationShare) {
          onLocationShare({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
            userId: currentUserId,
          });
        }
      });

      locationWatchRef.current = unwatch;
    } catch (error: any) {
      console.error('[ChatMessage] Error starting live tracking:', error);
      
      // Check if it's a location permission/settings error
      if (
        error?.message?.includes('unsatisfied device settings') ||
        error?.message?.includes('Location request failed') ||
        error?.code === 'LOCATION_UNAVAILABLE'
      ) {
        showLocationPermissionAlert();
      }
      
      setIsTrackingLive(false);
    }
  };

  // Stop live location tracking
  const stopLiveTracking = () => {
    if (locationWatchRef.current) {
      locationWatchRef.current();
      locationWatchRef.current = null;
    }
    setIsTrackingLive(false);
  };

  // Handle opening location settings
  const handleOpenLocationSettings = () => {
    if (Platform.OS === 'ios') {
      // iOS: Open Privacy > Location settings
      Linking.openURL('prefs:root=Privacy&path=LOCATION').catch(() => {
        // Fallback to Settings app
        Linking.openURL('app-settings:').catch(() => {
          Alert.alert(
            'Unable to Open Settings',
            'Please enable location permissions in Settings > Privacy > Location Services'
          );
        });
      });
    } else {
      // Android: Open Location settings
      Linking.openURL('content://com.android.settings/system')
        .catch(() => Linking.openURL('android.settings.LOCATION_SOURCE_SETTINGS'))
        .catch(() => {
          // Fallback: Open main Settings app
          Linking.openSettings().catch(() => {
            Alert.alert(
              'Unable to Open Settings',
              'Please enable location permissions in your device settings.'
            );
          });
        });
    }
  };

  // Show location permission alert
  const showLocationPermissionAlert = () => {
    Alert.alert(
      'Location Permission Required',
      'To share your live location, please enable location permissions in your device settings.',
      [
        {
          text: 'Cancel',
          onPress: () => {
            // Dismiss alert
          },
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => handleOpenLocationSettings(),
          style: 'default',
        },
      ],
      { cancelable: false }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current();
      }
    };
  }, []);

  const getReadStatusIcon = () => {
    // Only show read status for own messages
    if (!isOwnMessage) {
      return null;
    }

    console.log('[ChatMessage] Rendering for own message:', {
      messageId: message.id,
      isRider,
      read_by_driver: message.read_by_driver,
      read_by_rider: message.read_by_rider,
    });

    // Determine if the other person has read the message
    const otherPersonRead = isRider ? message.read_by_driver : message.read_by_rider;

    // Color: light on own colored message
    const checkColor = colors.primaryForeground;
    const iconSize = 15;

    // Show read status regardless of value
    if (otherPersonRead) {
      console.log('[ChatMessage] Showing READ checkmarks');
      return (
        <View style={{ paddingLeft: scale(4) }}>
          <MaterialCommunityIcons 
            name="check-all" 
            size={iconSize} 
            color={checkColor}
          />
        </View>
      );
    } else {
      console.log('[ChatMessage] Showing SENT single checkmark');
      return (
        <View style={{ paddingLeft: scale(4) }}>
          <MaterialCommunityIcons 
            name="check" 
            size={iconSize} 
            color={checkColor}
            style={{ opacity: 0.7 }}
          />
        </View>
      );
    }
  };

  const renderMessageContent = () => {
    if (message.message_type === 'location' && message.location_data) {
      return (
        <View style={styles.locationContainer}>
          <View style={styles.locationHeaderRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={24}
              color="#FF9203"
            />
            <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
              Location shared
            </Text>
          </View>
          <Text style={[styles.locationCoords, { color: colors.textSecondary }]}>
            {message.location_data.latitude.toFixed(6)}, {message.location_data.longitude.toFixed(6)}
          </Text>
          <View style={styles.locationButtonsContainer}>
            <TouchableOpacity
              onPress={() => setShowLocationMap(true)}
              style={[styles.viewLocationButton]}
            >
              <MaterialCommunityIcons
                name="map"
                size={16}
                color="#000"
              />
              <Text style={[styles.viewLocationButtonText]}>
                View on Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (isTrackingLive ? stopLiveTracking() : startLiveTracking())}
              style={[
                styles.liveLocationButton,
              ]}
            >
              <MaterialCommunityIcons
                name={isTrackingLive ? 'pause-circle' : 'play-circle'}
                size={16}
                color="#000"
              />
              <Text style={[styles.liveLocationButtonText]}>
                {isTrackingLive ? 'Stop' : 'Live'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <Text style={[styles.messageText, { color: isOwnMessage ? colors.primaryForeground : colors.text }]}>
        {message.content}
      </Text>
    );
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: isOwnMessage ? colors.primary : colors.surface,
          borderColor: colors.border,
        }
      ]}>
        {renderMessageContent()}
        <View style={styles.timeContainer}>
          <Text style={[
            styles.timestamp,
            { color: isOwnMessage ? colors.primaryForeground : colors.textTertiary }
          ]}>
            {formatTime(message.sent_at)}
          </Text>
          {getReadStatusIcon()}
        </View>
      </View>

      {message.message_type === 'location' && message.location_data && (
        <LocationMapModal
          visible={showLocationMap}
          latitude={message.location_data.latitude}
          longitude={message.location_data.longitude}
          onClose={() => {
            setShowLocationMap(false);
            stopLiveTracking();
          }}
          title="Shared Location"
          currentUserLocation={currentUserLocation}
          otherUserLocation={otherUserLocation}
          currentUserId={currentUserId}
          onStartLiveTracking={startLiveTracking}
          onStopLiveTracking={stopLiveTracking}
          isTrackingLive={isTrackingLive}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(4),
    marginHorizontal: scale(16),
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(16),
    borderWidth: 1,
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
  },
  locationContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(6),
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
    gap: scale(8),
  },
  locationTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  locationText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: verticalScale(2),
  },
  locationCoords: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(10),
    fontWeight: '500',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: verticalScale(4),
    width: '100%',
  },
  viewLocationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#FF9203',
    gap: scale(6),
  },
  viewLocationButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#000',
  },
  liveLocationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#FF9203',
    gap: scale(6),
  },
  liveLocationButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#000',
  },
  timestamp: {
    fontSize: moderateScale(10),
    textAlign: 'right',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: verticalScale(4),
    gap: scale(2),
  },
});