import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function AwaitingVerificationScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, updateUserProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const status = await apiService.getDriverStatus();
      if ((status as any)?.verificationStatus === 'verified' || !(status as any)?.code) {
        await updateUserProfile({ ...(user as any), isVerified: true, verificationStatus: 'verified' } as any);
        router.replace('/driver/home');
        return;
      }
      Alert.alert('Still under review', 'Your driver account is still awaiting Charter Keke verification.');
    } catch (error: any) {
      if (error?.response?.data?.code === 'driver_not_verified' || error?.code === 'driver_not_verified') {
        Alert.alert('Still under review', 'Your driver account is still awaiting Charter Keke verification.');
      } else {
        Alert.alert('Could not refresh', error?.message || 'Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const notifySupport = async () => {
    setNotifying(true);
    try {
      await apiService.post('/support/tickets', {
        subject: 'Driver verification follow-up',
        description: 'Please review my driver account verification so I can start receiving ride requests.',
        category: 'driver_verification',
        priority: 'normal',
        initialMessage: 'Please review my driver account verification.',
      });
      Alert.alert('Support notified', 'A support ticket has been created for your verification follow-up.');
    } catch (error: any) {
      Alert.alert('Could not notify support', error?.message || 'Please try again.');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="shield-lock" size={46} color="#FF8A00" />
        </View>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Awaiting verification</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Your driver account is being reviewed by Charter Keke. You can log in, but ride requests and driver actions unlock after approval.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={refreshStatus} disabled={refreshing}>
          {refreshing ? <ActivityIndicator color="#111" /> : <Text style={styles.primaryText}>Refresh status</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={notifySupport} disabled={notifying}>
          {notifying ? <ActivityIndicator color="#FF8A00" /> : <Text style={styles.secondaryText}>Notify support</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFF4E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, marginBottom: 28 },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryText: { color: '#111', fontWeight: '900', fontSize: 16 },
  secondaryButton: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#FF8A00', fontWeight: '800', fontSize: 15 },
});
