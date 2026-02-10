// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { apiService } from '@services/api';
import { COLORS } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface Document {
  title: string;
  type: string;
  icon: string;
  status: 'verified' | 'pending' | 'expired' | 'missing';
  url?: string;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDriverDetails();
      const driverData = data.combined || data.driver || data.user || data;
      
      const docs: Document[] = [
        {
          title: 'Driver License',
          type: 'license',
          icon: 'card-account-details',
          status: driverData?.license_picture_url ? 'verified' : 'pending',
          url: driverData?.license_picture_url,
        },
        {
          title: 'Vehicle Registration',
          type: 'vehicle',
          icon: 'car',
          status: driverData?.vehicle_picture_url ? 'verified' : 'pending',
          url: driverData?.vehicle_picture_url,
        },
        {
          title: 'Profile Picture',
          type: 'profile',
          icon: 'account-circle',
          status: driverData?.profile_picture_url ? 'verified' : 'pending',
          url: driverData?.profile_picture_url,
        },
      ];
      
      setDocuments(docs);
    } catch (error) {
      console.error('❌ [DOCUMENTS] Error fetching details:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'expired':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      router.push({
        pathname: '/driver/document-viewer',
        params: { url: doc.url, title: doc.title },
      });
    } else {
      Alert.alert('No Document', `${doc.title} has not been uploaded yet.`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: scale(16),
            paddingVertical: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="chevron-left" size={scale(24)} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={{ fontSize: scale(20), fontWeight: 'bold', color: colors.foreground }}>
              Documents
            </Text>
            <View style={{ width: scale(24) }} />
          </View>

          {/* Documents List */}
          <View style={{ paddingHorizontal: scale(16), paddingVertical: scale(20) }}>
            <View style={{ gap: scale(12) }}>
              {documents.map((doc, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleViewDocument(doc)}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: scale(12),
                    padding: scale(16),
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: scale(48),
                      height: scale(48),
                      borderRadius: scale(12),
                      backgroundColor: colors.background,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: scale(12),
                    }}>
                      <MaterialCommunityIcons 
                        name={doc.icon as any} 
                        size={scale(24)} 
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: scale(14), fontWeight: '600', color: colors.foreground, marginBottom: scale(4) }}>
                        {doc.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <MaterialCommunityIcons 
                          name={getStatusIcon(doc.status) as any} 
                          size={scale(14)} 
                          color={getStatusColor(doc.status)}
                        />
                        <Text style={{ fontSize: scale(12), color: getStatusColor(doc.status), fontWeight: '600', textTransform: 'capitalize' }}>
                          {doc.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={scale(20)} 
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Card */}
          <View style={{ paddingHorizontal: scale(16), paddingVertical: scale(20) }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: scale(12),
              padding: scale(16),
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons 
                  name="information" 
                  size={scale(20)} 
                  color={colors.primary}
                  style={{ marginRight: scale(12), marginTop: scale(2) }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(6) }}>
                    Document Verification
                  </Text>
                  <Text style={{ fontSize: scale(11), color: colors.mutedForeground, lineHeight: scale(16) }}>
                    All documents must be clear and valid to be verified. Please ensure the documents are up to date and match your profile information.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
