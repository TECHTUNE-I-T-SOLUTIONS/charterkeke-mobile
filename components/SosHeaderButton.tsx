import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useLocation } from '@/context/LocationContext';
import { apiService } from '@/services/api';
import { BRAND } from '@/utils/colors';
import { useAlert } from '@/context/AlertContext';

interface SosHeaderButtonProps {
  role: 'rider' | 'driver';
}

export default function SosHeaderButton({ role }: SosHeaderButtonProps) {
  const { currentLocation, getCurrentLocation, reverseGeocodeLocation } = useLocation();
  const { showConfirm, showSuccess, showError } = useAlert();
  const [sending, setSending] = useState(false);

  const sendSos = async () => {
    if (sending) return;

    showConfirm(
      'Send SOS alert?',
      'This will notify Charter Keke admins with your current location and device details.',
      async () => {
        try {
          setSending(true);
          const freshLocation = await getCurrentLocation().catch(() => null);
          const location = freshLocation || currentLocation;
          const reverseEntries = location
            ? await Location.reverseGeocodeAsync({
                latitude: location.latitude,
                longitude: location.longitude,
              }).catch(() => [])
            : [];
          const reverseEntry = reverseEntries[0];
          const fallbackAddress = location
            ? await reverseGeocodeLocation(location).catch(() => null)
            : null;
          const fullAddress = [
            reverseEntry?.name,
            reverseEntry?.street,
            reverseEntry?.district,
            reverseEntry?.city || reverseEntry?.subregion,
            reverseEntry?.region,
            reverseEntry?.postalCode,
            reverseEntry?.country,
          ]
            .filter(Boolean)
            .join(', ') || fallbackAddress;

          await apiService.post('/sos', {
            source: 'mobile_app_backend',
            role,
            location: location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: (location as any).accuracy,
                  altitude: (location as any).altitude,
                  heading: (location as any).heading,
                  speed: (location as any).speed,
                  timestamp: new Date().toISOString(),
                }
              : {},
            address: {
              fullAddress,
              address: fullAddress,
              street: reverseEntry?.street,
              placeName: reverseEntry?.name,
              city: reverseEntry?.city || reverseEntry?.subregion,
              region: reverseEntry?.region,
              country: reverseEntry?.country,
              postalCode: reverseEntry?.postalCode,
              district: reverseEntry?.district,
            },
            device: {
              deviceName: Device.deviceName,
              brand: Device.brand,
              manufacturer: Device.manufacturer,
              modelName: Device.modelName,
              modelId: Device.modelId,
              osName: Device.osName,
              osVersion: Device.osVersion,
              appVersion: Constants.expoConfig?.version,
              buildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
            },
          });

          showSuccess('SOS sent', 'Charter Keke admins have been alerted with your latest location.');
        } catch (error: any) {
          showError('SOS failed', error?.message || 'Unable to send SOS right now. Please call emergency support if you are in danger.');
        } finally {
          setSending(false);
        }
      },
      undefined,
      'Send SOS'
    );
  };

  return (
    <TouchableOpacity onPress={sendSos} disabled={sending} style={styles.button} activeOpacity={0.85}>
      <Image source={require('@/assets/sos.gif')} style={styles.gif} resizeMode="contain" />
      {sending ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={BRAND.primary} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: 160,
    height: 52,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});
