import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { sendLocalNotification } from '@/services/notificationService';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const { logout } = useAuth();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [busy, setBusy] = useState(false);

  const items = [
    { title: 'Data use', desc: 'We only use your profile and ride data to run the app safely.' },
    { title: 'Location', desc: 'Used for booking, live tracking, and pickup matching.' },
    { title: 'Messages', desc: 'Stored for ride communication and support history.' },
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

  const deleteAccount = () => {
    Alert.alert(
      'Delete account permanently?',
      'This permanently removes your login access and personal profile details from Charter Keke. Ride, payment, and safety records may be retained only where legally or operationally required.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await apiService.delete('/user/account');
              await logout();
              router.replace('/auth/welcome');
            } catch {
              Alert.alert('Failed', 'We could not delete your account. Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
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

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="shield-lock" size={34} color={colors.primary} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Your data, your control</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>Download your data anytime or permanently delete your account with confirmation.</Text>
        </View>

        <View style={styles.section}>
          {items.map((item) => (
            <View key={item.title} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item.desc}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={downloadMyData} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.primary} /> : <MaterialCommunityIcons name="download" size={20} color={colors.primary} />}
            <Text style={[styles.actionText, { color: colors.primary }]}>Download My Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.error || '#ef4444', backgroundColor: colors.card }]} onPress={deleteAccount} disabled={busy}>
            <MaterialCommunityIcons name="delete" size={20} color={colors.error || '#ef4444'} />
            <Text style={[styles.actionText, { color: colors.error || '#ef4444' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerIcon: { width: 24, height: 24 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  hero: { margin: 16, borderRadius: 18, padding: 18, borderWidth: 1, alignItems: 'center' },
  heroTitle: { marginTop: 10, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  heroText: { marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  section: { paddingHorizontal: 16, marginTop: 8, gap: 10 },
  infoCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  infoTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  infoText: { fontSize: 12, lineHeight: 18 },
  actions: { paddingHorizontal: 16, marginTop: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, marginTop: 12 },
  actionText: { fontSize: 14, fontWeight: '800' },
});
