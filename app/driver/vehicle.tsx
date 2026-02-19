import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND } from '@/utils/colors';

interface VehicleDetails {
  vehicle_type?: string;
  plate_number?: string;
  union_name?: string;
  vehicle_color?: string;
  vehicle_picture_url?: string;
  license_picture_url?: string;
  // insurance_policy_url?: string;
}

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<VehicleDetails | null>(null);
  const [uploadingType, setUploadingType] = useState<'vehicle' | 'license' | null>(null);

  const isLight = mode === 'light';

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    const cached = await cacheService.get<VehicleDetails>('driver_vehicle_details');
    if (cached) {
      setDetails(cached);
      setLoading(false);
    }

    await fetchDetails(!cached);
  };

  const fetchDetails = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await apiService.getDriverDetails();
      const driverData = data.combined || data.driver || data.user || data || {};
      const nextDetails: VehicleDetails = {
        vehicle_type: driverData.vehicle_type || driverData.vehicleType,
        plate_number: driverData.plate_number || driverData.plateNumber,
        union_name: driverData.union_name || driverData.unionName,
        vehicle_color: driverData.vehicle_color || driverData.vehicleColor,
        vehicle_picture_url: driverData.vehicle_picture_url || driverData.vehicleImage,
        license_picture_url: driverData.license_picture_url || driverData.licenseImage,
        // insurance_policy_url: driverData.insurance_policy_url || driverData.insuranceImage,
      };

      setDetails(nextDetails);
      await cacheService.set('driver_vehicle_details', nextDetails);
    } catch (error) {
      console.error('❌ [VEHICLE] Error loading vehicle details:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleUploadPicture = async (type: 'vehicle' | 'license') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to upload your document.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split('/').pop() || `${type}.jpg`;
      const fileType = asset.mimeType || 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: fileType,
        name: fileName,
      } as any);
      formData.append('type', type);

      setUploadingType(type);
      const response: any = await apiService.post('/upload/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response?.url) {
        throw new Error(response?.error || 'Upload failed');
      }

      await cacheService.remove('driver_vehicle_details');
      await cacheService.remove('driver_documents');
      await fetchDetails(false);
      Alert.alert('Success', `${type === 'vehicle' ? 'Vehicle photo' : 'Driver license'} uploaded successfully.`);
    } catch (error: any) {
      console.error('[VEHICLE] upload error:', error);
      Alert.alert('Upload Failed', error?.message || 'Unable to upload image. Please try again.');
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.inputBackground }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Vehicle Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ListScreenSkeleton itemCount={3} />
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Vehicle Photo */}
            <View style={[styles.photoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
              {details?.vehicle_picture_url ? (
                <Image source={{ uri: details.vehicle_picture_url }} style={styles.vehicleImage} resizeMode="cover" />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.inputBackground }]}> 
                  <MaterialCommunityIcons name="car-outline" size={40} color={theme.colors.textTertiary} />
                  <Text style={[styles.photoPlaceholderText, { color: theme.colors.textSecondary }]}>No vehicle photo</Text>
                  <TouchableOpacity
                    onPress={() => handleUploadPicture('vehicle')}
                    style={styles.inlineUploadBtn}
                    disabled={uploadingType === 'vehicle'}
                  >
                    {uploadingType === 'vehicle' ? (
                      <ActivityIndicator size="small" color={BRAND.primary} />
                    ) : (
                      <Text style={styles.inlineUploadText}>Upload</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Vehicle Info */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>VEHICLE INFO</Text>
              <InfoRow label="Vehicle Type" value={details?.vehicle_type || 'Not set'} theme={theme} />
              <InfoRow label="Plate Number" value={details?.plate_number || 'Not set'} theme={theme} />
              <InfoRow label="Union Name" value={details?.union_name || 'Not set'} theme={theme} />
              <InfoRow label="Color" value={details?.vehicle_color || 'Not set'} theme={theme} />
            </View>

            {/* Documents */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>DOCUMENTS</Text>
              <DocRow
                label="Driver License"
                hasDoc={!!details?.license_picture_url}
                theme={theme}
                loading={uploadingType === 'license'}
                onUpload={() => handleUploadPicture('license')}
              />
              {/* <DocRow label="Insurance Policy" hasDoc={!!details?.insurance_policy_url} theme={theme} /> */}
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                onPress={() => router.push('/driver/documents')}
              >
                <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Manage Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: BRAND.primary }]}
                onPress={() => router.push('/driver/edit-profile')}
              >
                <Text style={[styles.actionText, { color: '#000', fontWeight: '700' }]}>Update Details</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const InfoRow = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{value}</Text>
  </View>
);

const DocRow = ({
  label,
  hasDoc,
  theme,
  onUpload,
  loading,
}: {
  label: string;
  hasDoc: boolean;
  theme: any;
  onUpload?: () => void;
  loading?: boolean;
}) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    <View style={[styles.docStatus, { gap: 8 }]}> 
      <MaterialCommunityIcons
        name={hasDoc ? 'check-circle' : 'alert-circle'}
        size={16}
        color={hasDoc ? '#10B981' : '#F59E0B'}
      />
      <Text style={[styles.docText, { color: hasDoc ? '#10B981' : '#F59E0B' }]}>
        {hasDoc ? 'Verified' : 'Missing'}
      </Text>
      {!!onUpload && (
        <TouchableOpacity onPress={onUpload} style={styles.docUploadBtn} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={BRAND.primary} />
          ) : (
            <Text style={styles.docUploadText}>{hasDoc ? 'Replace' : 'Upload'}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 120 },
  photoCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  vehicleImage: { width: '100%', height: 200 },
  photoPlaceholder: { height: 200, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { marginTop: 8, fontSize: 12, fontWeight: '600' },
  inlineUploadBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  inlineUploadText: { color: BRAND.primary, fontSize: 12, fontWeight: '700' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: '700', marginBottom: 12, letterSpacing: 0.4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700' },
  docStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docText: { fontSize: 12, fontWeight: '700' },
  docUploadBtn: {
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 64,
    alignItems: 'center',
  },
  docUploadText: { fontSize: 11, fontWeight: '700', color: BRAND.primary },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: '600' },
});
