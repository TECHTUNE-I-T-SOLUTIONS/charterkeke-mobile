// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { apiService } from '@services/api';
import { cacheService } from '@services/cache';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import Button from '@components/ui/Button';
import { COLORS } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function BankAccountsScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  const [hasCached, setHasCached] = useState(false);
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadBankDetails();
    loadBanks();
  }, []);

  useEffect(() => {
    if (!formData.bankCode && formData.bankName && banks.length) {
      const match = banks.find(
        (bank) => bank.name.toLowerCase() === formData.bankName.toLowerCase()
      );
      if (match) {
        setFormData((prev) => ({ ...prev, bankCode: match.code }));
      }
    }
  }, [banks, formData.bankCode, formData.bankName]);

  const loadBankDetails = async () => {
    const cached = await cacheService.get<any>('driver_bank_accounts');
    if (cached) {
      setFormData(cached);
      setAccountVerified(!!cached.accountName);
      setHasCached(true);
      setLoading(false);
    }

    await fetchBankDetails(!cached);
  };

  const fetchBankDetails = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await apiService.getDriverDetails();
      const driverData = data.combined || data.driver || data.user || data;
      
      const nextForm = {
        bankName: driverData?.bank_name || '',
        bankCode: driverData?.bank_code || '',
        accountNumber: driverData?.bank_account_number || '',
        accountName: driverData?.account_name || '',
      };
      setFormData(nextForm);
      setAccountVerified(!!nextForm.accountName);
      await cacheService.set('driver_bank_accounts', nextForm);
    } catch (error) {
      console.error('❌ [BANK-ACCOUNTS] Error fetching details:', error);
      Alert.alert('Error', 'Failed to load bank account details');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const resetVerification = () => {
    setAccountVerified(false);
    setFormData((prev) => ({ ...prev, accountName: '' }));
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'accountNumber') {
      const numeric = value.replace(/\D/g, '').slice(0, 10);
      resetVerification();
      setFormData(prev => ({ ...prev, accountNumber: numeric }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadBanks = async () => {
    setLoadingBanks(true);
    try {
      const paystackKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
      const response = await fetch('https://api.paystack.co/bank', {
        headers: paystackKey ? { Authorization: `Bearer ${paystackKey}` } : {},
      });
      const data = await response.json();
      if (data?.status && Array.isArray(data.data)) {
        const activeBanks = data.data.filter((bank: any) => bank.active !== false);
        const seen = new Set<string>();
        const uniqueBanks = activeBanks
          .map((bank: any) => ({ code: String(bank.code || ''), name: String(bank.name || '') }))
          .filter((bank: { code: string; name: string }) => {
            const key = `${bank.code}-${bank.name.toLowerCase()}`;
            if (!bank.code || !bank.name || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        setBanks(uniqueBanks);
      } else {
        setBanks([]);
      }
    } catch (error) {
      console.error('❌ [BANK-ACCOUNTS] Failed to load banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSelectBank = (bank: { code: string; name: string }) => {
    resetVerification();
    setFormData((prev) => ({
      ...prev,
      bankName: bank.name,
      bankCode: bank.code,
    }));
    setBankPickerVisible(false);
  };

  const handleVerifyAccount = async () => {
    if (!formData.bankCode) {
      Alert.alert('Select Bank', 'Please select a bank to continue.');
      return;
    }
    if (!formData.accountNumber || formData.accountNumber.length !== 10) {
      Alert.alert('Invalid Account', 'Enter a valid 10-digit account number.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Unable to verify account. Missing driver ID.');
      return;
    }

    try {
      setVerifyingAccount(true);
      const response = await apiService.post('/driver/account-verify', {
        action: 'verify',
        accountNumber: formData.accountNumber,
        bankCode: formData.bankCode,
        driverId: user.id,
      });

      if (response?.success) {
        setFormData((prev) => ({
          ...prev,
          accountName: response.accountName || prev.accountName,
        }));
        setAccountVerified(true);
        Alert.alert('Verified', 'Account verified successfully.');
        return;
      }

      setAccountVerified(false);
      Alert.alert('Verification Failed', response?.error || 'Account verification failed.');
    } catch (error: any) {
      setAccountVerified(false);
      const message = error?.message || 'Account verification failed.';
      Alert.alert('Verification Failed', message);
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.bankName || !formData.bankCode || !formData.accountNumber) {
        Alert.alert('Missing Fields', 'Please fill in all bank details');
        return;
      }
      if (!formData.accountName) {
        Alert.alert('Missing Account Name', 'Please verify or enter the account name.');
        return;
      }

      if (!accountVerified && user?.id) {
        await apiService.post('/driver/account-verify', {
          action: 'saveManual',
          accountName: formData.accountName,
          driverId: user.id,
        });
      }

      const payload = {
        bank_name: formData.bankName,
        bank_code: formData.bankCode,
        bank_account_number: formData.accountNumber,
        account_name: formData.accountName,
      };

      const response = await apiService.put('/driver/details', payload);
      
      if (response) {
        Alert.alert('Success', 'Bank account updated successfully');
        setEditing(false);
        fetchBankDetails();
      }
    } catch (error) {
      console.error('❌ [BANK-ACCOUNTS] Save error:', error);
      Alert.alert('Error', 'Failed to save bank account details');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ListScreenSkeleton itemCount={3} />
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
              Bank Accounts
            </Text>
            <TouchableOpacity
              onPress={() => setEditing(!editing)}
              style={{
                padding: scale(8),
              }}
            >
              <MaterialCommunityIcons 
                name={editing ? "close" : "pencil"} 
                size={scale(20)} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {/* Account Details Card */}
          <View style={{ paddingHorizontal: scale(16), paddingVertical: scale(20) }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: scale(12),
              padding: scale(16),
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              {editing ? (
                <>
                  {/* Bank Name */}
                  <View style={{ marginBottom: scale(16) }}>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                      Bank Name
                    </Text>
                    <TouchableOpacity
                      onPress={() => setBankPickerVisible(true)}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: scale(8),
                        paddingHorizontal: scale(12),
                        paddingVertical: scale(12),
                        backgroundColor: colors.background,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{
                        fontSize: scale(14),
                        color: formData.bankName ? colors.foreground : colors.mutedForeground,
                      }}>
                        {formData.bankName || (loadingBanks ? 'Loading banks...' : 'Select bank')}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={scale(18)} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {/* Account Number */}
                  <View style={{ marginBottom: scale(16) }}>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                      Account Number
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: scale(8),
                        paddingHorizontal: scale(12),
                        paddingVertical: scale(12),
                        fontSize: scale(14),
                        color: colors.foreground,
                        backgroundColor: colors.background,
                      }}
                      placeholderTextColor={colors.mutedForeground}
                      placeholder="Enter account number"
                      value={formData.accountNumber}
                      onChangeText={(value) => handleInputChange('accountNumber', value)}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    onPress={handleVerifyAccount}
                    disabled={verifyingAccount || !formData.bankCode || formData.accountNumber.length !== 10}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: scale(12),
                      borderRadius: scale(8),
                      alignItems: 'center',
                      marginBottom: scale(16),
                      opacity: verifyingAccount || !formData.bankCode || formData.accountNumber.length !== 10 ? 0.6 : 1,
                    }}
                  >
                    {verifyingAccount ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: scale(14) }}>
                        Verify Account
                      </Text>
                    )}
                  </TouchableOpacity>

                  {accountVerified && !!formData.accountName && (
                    <View style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      borderRadius: scale(8),
                      padding: scale(12),
                      borderWidth: 1,
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      marginBottom: scale(16),
                    }}>
                      <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: scale(4) }}>
                        Verified Account
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: scale(12) }}>
                        {formData.accountName}
                      </Text>
                    </View>
                  )}

                  {/* Account Name */}
                  <View style={{ marginBottom: scale(16) }}>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(8) }}>
                      Account Name
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: scale(8),
                        paddingHorizontal: scale(12),
                        paddingVertical: scale(12),
                        fontSize: scale(14),
                        color: colors.foreground,
                        backgroundColor: colors.background,
                      }}
                      placeholderTextColor={colors.mutedForeground}
                      placeholder="Enter account name"
                      value={formData.accountName}
                      onChangeText={(value) => handleInputChange('accountName', value)}
                    />
                  </View>

                  {/* Save Button */}
                  <Button
                    title="Save Account Details"
                    onPress={handleSave}
                    isDark={mode === 'dark'}
                  />
                </>
              ) : (
                <>
                  {/* Bank Name Display */}
                  <View style={{ marginBottom: scale(16) }}>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.mutedForeground, marginBottom: scale(6) }}>
                      Bank Name
                    </Text>
                    <Text style={{ fontSize: scale(14), fontWeight: '500', color: colors.foreground }}>
                      {formData.bankName || 'Not provided'}
                    </Text>
                  </View>

                  {/* Account Number Display */}
                  <View style={{ marginBottom: scale(16) }}>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.mutedForeground, marginBottom: scale(6) }}>
                      Account Number
                    </Text>
                    <Text style={{ fontSize: scale(14), fontWeight: '500', color: colors.foreground, fontFamily: 'monospace' }}>
                      {formData.accountNumber || 'Not provided'}
                    </Text>
                  </View>

                  {/* Account Name Display */}
                  <View>
                    <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.mutedForeground, marginBottom: scale(6) }}>
                      Account Name
                    </Text>
                    <Text style={{ fontSize: scale(14), fontWeight: '500', color: colors.foreground }}>
                      {formData.accountName || 'Not provided'}
                    </Text>
                  </View>
                </>
              )}
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
                    Bank Account Information
                  </Text>
                  <Text style={{ fontSize: scale(11), color: colors.mutedForeground, lineHeight: scale(16) }}>
                    This bank account will be used for all your earnings withdrawals. Please ensure the account details are correct to avoid delays in payment processing.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={bankPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBankPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: scale(16),
            borderTopRightRadius: scale(16),
            padding: scale(16),
            maxHeight: '70%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) }}>
              <Text style={{ fontSize: scale(16), fontWeight: '700', color: colors.foreground }}>Select Bank</Text>
              <TouchableOpacity onPress={() => setBankPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={scale(20)} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: scale(8),
              paddingHorizontal: scale(10),
              paddingVertical: scale(8),
              marginBottom: scale(12),
            }}>
              <TextInput
                placeholder="Search bank"
                placeholderTextColor={colors.mutedForeground}
                value={bankSearch}
                onChangeText={setBankSearch}
                style={{ color: colors.foreground, fontSize: scale(13) }}
              />
            </View>
            <ScrollView>
              {(bankSearch ? banks.filter((bank) => bank.name.toLowerCase().includes(bankSearch.toLowerCase())) : banks)
                .map((bank, idx) => (
                  <TouchableOpacity
                    key={`${bank.code}-${bank.name}-${idx}`}
                    onPress={() => handleSelectBank(bank)}
                    style={{
                      paddingVertical: scale(10),
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontSize: scale(14) }}>{bank.name}</Text>
                  </TouchableOpacity>
                ))}
              {!loadingBanks && banks.length === 0 && (
                <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: scale(20) }}>
                  No banks available
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
