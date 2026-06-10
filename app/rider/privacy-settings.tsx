import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { sendLocalNotification } from '@/services/notificationService';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ delete?: string }>();
  const { theme, mode } = useTheme();
  const { logout, clearCache } = useAuth();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const openedDeletePrompt = useRef(false);

  useEffect(() => {
    if (params.delete === '1' && !openedDeletePrompt.current) {
      openedDeletePrompt.current = true;
      setShowDeleteConfirm(true);
    }
  }, [params.delete]);

  const policySections = [
    {
      icon: 'account-lock-outline',
      title: 'Account and identity data',
      desc: 'We collect the details needed to create and protect your account, including name, phone number, email address, profile photo, role, verification status, and support history.',
    },
    {
      icon: 'map-marker-radius-outline',
      title: 'Location and ride data',
      desc: 'Location is used to set pickup points, match nearby drivers, calculate routes and fares, support live tracking, resolve safety incidents, and improve service coverage.',
    },
    {
      icon: 'message-processing-outline',
      title: 'Messages and support',
      desc: 'In-app chats, support tickets, attachments, and replies may be stored so riders, drivers, and support agents can continue conversations and audit issue resolution.',
    },
    {
      icon: 'credit-card-lock-outline',
      title: 'Payments and wallet activity',
      desc: 'Payment references, wallet entries, remittance activity, receipts, and settlement records are processed to complete rides, prevent fraud, and meet accounting obligations.',
    },
    {
      icon: 'bell-outline',
      title: 'Notifications',
      desc: 'We send ride, safety, support, payment, account, and operational updates through in-app notifications, push notifications, email, SMS, or phone where appropriate.',
    },
    {
      icon: 'shield-check-outline',
      title: 'Security and retention',
      desc: 'We use access controls, logs, and monitoring to protect the platform. Records are kept only as long as needed for operations, dispute handling, legal compliance, and safety.',
    },
  ];

  const downloadMyData = async () => {
    try {
      setBusy(true);
      const [profile, rides, wallet] = await Promise.all([
        apiService.get('/user/profile'),
        apiService.get('/user/ride-history?limit=100').catch(() => ({ rides: [] })),
        apiService.get('/user/wallet').catch(() => ({})),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        profile: (profile as any)?.user || profile,
        rides: (rides as any)?.rides || [],
        wallet,
      };

      const fileUri = `${FileSystem.documentDirectory}charter-keke-my-data-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));

      await Share.share({
        message: 'Charter Keke data export',
        url: fileUri,
        title: 'Save or share your Charter Keke data',
      });

      await sendLocalNotification('Data saved', 'Your Charter Keke data export is ready.');
      Alert.alert('Saved', 'Your data export has been created. You can now save it to Files or share it.');
    } catch {
      Alert.alert('Download failed', 'We could not prepare your data export right now.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      setBusy(true);
      setShowDeleteConfirm(false);
      await apiService.delete('/user/account');
      if (clearCache) await clearCache();
      await logout();
      router.replace('/auth/welcome');
    } catch {
      Alert.alert('Deletion failed', 'We could not delete your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '18' }]}>
            <MaterialCommunityIcons name="shield-lock" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Privacy Policy</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>
            Charter Keke protects rider and driver information while using the data needed to book rides, track trips, support customers, process payments, and keep the platform safe.
          </Text>
          <View style={[styles.updatedPill, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.updatedText, { color: colors.primary }]}>Last updated: June 10, 2026</Text>
          </View>
        </View>

        <View style={styles.sectionIntro}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>WHAT WE HANDLE</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            We do not sell personal information. Access is limited to authorized systems, service providers, and Charter Keke staff who need it to operate the service, investigate safety issues, or meet legal obligations.
          </Text>
        </View>

        <View style={styles.section}>
          {policySections.map((item) => (
            <View key={item.title} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '16' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>Your choices</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            You can update your profile, control device permissions from your phone settings, manage notification permissions, request support, export your data, or ask us to review eligible account information.
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>ACCOUNT CONTROLS</Text>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={downloadMyData} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.primary} /> : <MaterialCommunityIcons name="download" size={20} color={colors.primary} />}
            <Text style={[styles.actionText, { color: colors.primary }]}>Download My Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.error || '#ef4444', backgroundColor: colors.card }]} onPress={() => setShowDeleteConfirm(true)} disabled={busy}>
            <MaterialCommunityIcons name="delete" size={20} color={colors.error || '#ef4444'} />
            <Text style={[styles.actionText, { color: colors.error || '#ef4444' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Account Permanently"
        message="This permanently deletes your Charter Keke account, removes your login access, and logs you out."
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
        cancelText="Keep Account"
        confirmText={busy ? 'Deleting...' : 'Delete Account'}
        isDark={isDark}
        type="danger"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerIcon: { width: 24, height: 24 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  hero: { margin: 16, borderRadius: 22, padding: 20, borderWidth: 1, alignItems: 'center' },
  heroIcon: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { marginTop: 12, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  heroText: { marginTop: 8, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  updatedPill: { marginTop: 14, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  updatedText: { fontSize: 11, fontWeight: '800' },
  sectionIntro: { paddingHorizontal: 16, marginTop: 4 },
  sectionEyebrow: { fontSize: 11, fontWeight: '900', marginBottom: 8 },
  sectionText: { fontSize: 13, lineHeight: 20 },
  section: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  infoCard: { borderRadius: 16, padding: 15, borderWidth: 1, flexDirection: 'row', gap: 12 },
  infoIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '900', marginBottom: 5 },
  infoText: { fontSize: 12, lineHeight: 18 },
  noticeCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16, borderWidth: 1 },
  noticeTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  noticeText: { fontSize: 12, lineHeight: 19 },
  actions: { paddingHorizontal: 16, marginTop: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, marginTop: 12 },
  actionText: { fontSize: 14, fontWeight: '800' },
});
