import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';

export default function DriverReferrals() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        setLoading(true);
        const res = await apiService.getReferrals();
        console.log('[Driver Referrals] getReferrals response:', JSON.stringify(res));
        
        // Extract code string safely from nested structure
        const codeStr = (res?.referralCode?.referral_code || res?.referral_code || '');
        const finalCode = String(codeStr).trim();
        
        console.log('[Driver Referrals] Extracted code:', finalCode);
        
        // Store just the code string, not the entire object
        setReferralData({ referral_code: finalCode });
        setReferrals(res?.referrals || []);
      } catch (err) {
        console.error('[Driver Referrals] Failed to load:', err);
        Alert.alert('Error', 'Unable to load referrals');
      } finally {
        setLoading(false);
      }
    };
    
    loadReferrals();
  }, []);

  const handleCopy = async () => {
    try {
      const code = referralData?.referral_code || referralData?.referralCode || '';
      if (!code) return;
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied', 'Referral code copied to clipboard');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700' }}>Driver Referral Program</Text>
            <Text style={{ color: theme.colors.textSecondary, marginTop: 6 }}>Invite other drivers and earn rewards.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Your Referral Code</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{referralData?.referral_code || referralData?.referralCode || 'N/A'}</Text>
            <TouchableOpacity onPress={handleCopy}>
              <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Share this code with other drivers to earn rewards.</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>Your Referrals</Text>
          {referrals.length === 0 ? (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
              <Text style={{ color: theme.colors.textSecondary }}>No referrals yet</Text>
            </View>
          ) : (
            referrals.map((r) => (
              <View key={r.id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginBottom: 8 }]}>
                <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>{r.referee?.first_name} {r.referee?.last_name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>{r.referee?.email}</Text>
                <Text style={{ color: theme.colors.textSecondary, marginTop: 6 }}>Status: {r.status}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 10, borderWidth: 1 }
});
