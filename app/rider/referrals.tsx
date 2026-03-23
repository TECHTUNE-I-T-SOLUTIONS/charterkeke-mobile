import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';

export default function RiderReferrals() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await apiService.getReferrals();
        console.log('🔍 Raw getReferrals response:', JSON.stringify(res));
        
        // Extract code string safely
        const codeStr = (res?.referralCode?.referral_code || res?.referral_code || '');
        const finalCode = String(codeStr).trim();
        
        console.log('[Referrals] Extracted code:', finalCode);
        
        setReferralData({ referral_code: finalCode });
        setReferrals(res?.referrals || []);
      } catch (err) {
        console.error('Failed to load referrals:', err);
        Alert.alert('Error', 'Unable to load referrals');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCopy = async () => {
    try {
      const code = referralData?.referral_code || referralData?.referralCode || '';
      if (!code) return;
      await import('expo-clipboard').then((c) => c.setStringAsync(code));
      Alert.alert('Copied', 'Referral code copied to clipboard');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700', marginLeft: 12, flex: 1 }}>Referral Program</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 6 }}>Invite friends and earn rewards.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Your Referral Code</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary }}>
              {typeof referralData?.referral_code === 'string' && referralData.referral_code.length > 0
                ? referralData.referral_code
                : 'N/A'}
            </Text>
            <TouchableOpacity onPress={handleCopy}>
              <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Share this code with friends. You both get rewarded when they complete their first ride.</Text>
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
