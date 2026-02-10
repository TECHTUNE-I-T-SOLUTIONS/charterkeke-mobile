// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { apiService } from '@services/api';
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
    accountNumber: '',
    accountName: '',
  });

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDriverDetails();
      const driverData = data.combined || data.driver || data.user || data;
      
      setFormData({
        bankName: driverData?.bank_name || '',
        accountNumber: driverData?.bank_account_number || '',
        accountName: driverData?.account_name || '',
      });
    } catch (error) {
      console.error('❌ [BANK-ACCOUNTS] Error fetching details:', error);
      Alert.alert('Error', 'Failed to load bank account details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
        Alert.alert('Missing Fields', 'Please fill in all bank details');
        return;
      }

      const payload = {
        bank_name: formData.bankName,
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
                      placeholder="Enter bank name"
                      value={formData.bankName}
                      onChangeText={(value) => handleInputChange('bankName', value)}
                    />
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
                    />
                  </View>

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
    </View>
  );
}
