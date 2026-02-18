// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND, COLORS } from '@/utils/colors';

interface Document {
  title: string;
  type: string;
  icon: string;
  status: 'verified' | 'pending' | 'expired' | 'missing';
  url?: string;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hasCached, setHasCached] = useState(false);

  const isLight = mode === 'light';

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const cached = await cacheService.get<Document[]>('driver_documents');
    if (cached) {
      setDocuments(cached);
      setHasCached(true);
      setLoading(false);
    }

    await fetchDocuments(!cached);
  };

  const fetchDocuments = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      // Mock or fetch logic
      const data = await apiService.getDriverDetails().catch(() => ({}));
      const driverData = data.combined || data.driver || data.user || data || {};
      
      const nextDocuments: Document[] = [
        { title: 'Driver License', type: 'license', icon: 'card-account-details', status: driverData.license_picture_url ? 'verified' : 'missing', url: driverData.license_picture_url },
        { title: 'Vehicle Registration', type: 'vehicle', icon: 'car', status: driverData.vehicle_picture_url ? 'verified' : 'missing', url: driverData.vehicle_picture_url },
        { title: 'Insurance Policy', type: 'insurance', icon: 'shield-check', status: 'pending' }, // Mock
      ];

      setDocuments(nextDocuments);
      await cacheService.set('driver_documents', nextDocuments);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'missing': return '#EF4444';
      default: return theme.colors.textSecondary;
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
           <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Documents</Text>
           <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
           {/* Info Banner */}
           <View style={[styles.banner, { backgroundColor: BRAND.primary + '15', borderColor: BRAND.primary }]}>
              <MaterialCommunityIcons name="information" size={20} color={BRAND.primary} />
              <Text style={[styles.bannerText, { color: theme.colors.textPrimary }]}>
                 Please ensure all documents are up-to-date to keep your account active.
              </Text>
           </View>

           {/* List */}
           {loading ? <ListScreenSkeleton itemCount={3} /> : (
             <View style={styles.list}>
                {documents.map((doc, i) => (
                   <TouchableOpacity
                     key={i}
                     style={[styles.docCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                     onPress={() =>
                       router.push({
                         pathname: '/driver/document-viewer',
                         params: { url: doc.url || '', title: doc.title },
                       } as any)
                     }
                     activeOpacity={0.8}
                   >
                      <View style={[styles.iconBox, { backgroundColor: theme.colors.inputBackground }]}>
                         <MaterialCommunityIcons name={doc.icon as any} size={24} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.docInfo}>
                         <Text style={[styles.docTitle, { color: theme.colors.textPrimary }]}>{doc.title}</Text>
                         <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            <MaterialCommunityIcons name={doc.status === 'verified' ? 'check-circle' : 'alert-circle'} size={14} color={getStatusColor(doc.status)} />
                            <Text style={[styles.docStatus, { color: getStatusColor(doc.status) }]}>{doc.status.toUpperCase()}</Text>
                         </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />
                   </TouchableOpacity>
                ))}
             </View>
           )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 100 },
  banner: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, gap: 12, marginBottom: 24, alignItems: 'center' },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  list: { gap: 12 },
  docCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: '700' },
  docStatus: { fontSize: 11, fontWeight: '600' },
});
