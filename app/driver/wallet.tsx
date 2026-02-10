'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiService } from '@/services/api';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@/utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface Transaction {
  id: string;
  type: 'withdrawal' | 'earning' | 'bonus';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

interface BankAccount {
  id: number;
  name: string;
  accountNumber: string;
  accountName: string;
}

interface WalletData {
  balance: number;
  pendingWithdrawal: number;
  withdrawn: number;
  minimumWithdrawal: number;
}

export default function DriverWalletScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    fetchWalletData();
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
    }).start();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      console.log('👛 [WALLET] Fetching wallet data...');
      
      // Get userId from AuthContext
      if (!user?.id) {
        console.error('❌ [WALLET] No authenticated user found');
        setWalletData({ balance: 0, pendingWithdrawal: 0, withdrawn: 0, minimumWithdrawal: 500 });
        return;
      }

      const userId = user.id;
      console.log('✅ [WALLET] Got userId from AuthContext:', userId);

      // Fetch: Payment status (wallet, pending, withdrawn), Driver details (bank accounts)
      // Note: DO NOT include /api/ prefix - baseURL already has it
      const [paymentRes, detailsRes] = await Promise.all([
        apiService.get(`/driver/payment-status?driver_id=${userId}`).catch((err) => {
          console.error('❌ [WALLET] Payment status error:', err);
          return {};
        }),
        apiService.get(`/driver/details`).catch((err) => {
          console.error('❌ [WALLET] Driver details error:', err);
          return {};
        }),
      ]);
      
      console.log('✅ [WALLET] Payment status:', paymentRes);
      console.log('✅ [WALLET] Driver details:', detailsRes);

      // Extract wallet data from payment status
      const paymentData = paymentRes as any;
      const totalPending = paymentData?.totalPending || 0;
      const settlements = paymentData?.settlements || [];

      // Calculate withdrawn from settled payments
      const totalWithdrawn = settlements
        ?.filter((s: any) => s.settlement_status === 'paid')
        ?.reduce((sum: number, s: any) => sum + (s.total_platform_fees || 0), 0) || 0;

      setWalletData({
        balance: totalPending,
        pendingWithdrawal: totalPending,
        withdrawn: totalWithdrawn,
        minimumWithdrawal: 500
      });

      // Extract bank accounts from driver details
      const driverDetails = detailsRes as any;
      if (driverDetails?.combined?.bank_account_number) {
        setBankAccounts([{
          id: 1,
          name: driverDetails.combined.bank_name || 'Primary Account',
          accountNumber: driverDetails.combined.bank_account_number || 'N/A',
          accountName: `${driverDetails.combined.first_name || ''} ${driverDetails.combined.last_name || ''}`.trim(),
        }]);
      }

      // Fetch transaction history (ride history)
      // Note: DO NOT include /api/ prefix - baseURL already has it
      const historyRes = await apiService.get('/driver/ride-history?page=1').catch(() => ({ rides: [] }));
      const rides = (historyRes as any)?.rides || [];
      
      const txns: Transaction[] = rides.map((ride: any) => ({
        id: ride.id,
        type: 'earning' as const,
        amount: ride.driver_earnings || 0,
        date: ride.completed_at || ride.created_at || new Date().toISOString(),
        status: ride.status === 'completed' ? 'completed' : 'pending' as const,
        description: `${ride.pickup_zone} → ${ride.destination_zone}`
      }));
      
      setTransactions(txns);

    } catch (error) {
      console.error('❌ [WALLET] Failed to fetch wallet data:', error);
      setWalletData({ balance: 0, pendingWithdrawal: 0, withdrawn: 0, minimumWithdrawal: 500 });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickWithdrawal = (amount: number): void => {
    setWithdrawalAmount(amount.toString());
    setShowWithdrawalModal(true);
  };

  const handleWithdraw = async (): Promise<void> => {
    if (!walletData) return;

    const amount = parseFloat(withdrawalAmount);
    if (amount < walletData.minimumWithdrawal) {
      alert(`Minimum withdrawal is ₦${walletData.minimumWithdrawal}`);
      return;
    }
    if (amount > walletData.balance) {
      alert('Insufficient balance');
      return;
    }

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          accountId: bankAccounts[selectedAccount].id,
        }),
      });

      if (response.ok) {
        setShowWithdrawalModal(false);
        setWithdrawalAmount('');
        alert('Withdrawal request submitted. You will receive it within 24 hours.');
        fetchWalletData();
      } else {
        alert('Failed to process withdrawal. Please try again.');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'withdrawal':
        return '💳';
      case 'earning':
        return '💰';
      case 'bonus':
        return '🎁';
      default:
        return '📊';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  if (loading || !walletData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(100) }}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['rgba(30, 30, 30, 0.8)', 'rgba(20, 20, 20, 0.6)'] : ['rgba(240, 240, 240, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: scale(16),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: scale(28), fontWeight: 'bold', color: colors.text }}>
            Wallet
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/driver/notifications')}
            style={{
              width: scale(44),
              height: scale(44),
              borderRadius: scale(8),
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialCommunityIcons name="bell" size={scale(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Main Balance Card */}
        <Animated.View style={{ paddingHorizontal: scale(20), marginTop: scale(20), marginBottom: scale(20), transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: scale(20),
              paddingVertical: scale(24),
              borderRadius: scale(12),
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: scale(12), color: '#ffffff80', marginBottom: 8 }}>
              Available Balance
            </Text>
            <Text style={{ fontSize: scale(36), fontWeight: 'bold', color: '#ffffff', marginBottom: scale(16) }}>
              ₦{walletData.balance.toLocaleString()}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: scale(11), color: '#ffffff80', marginBottom: 4 }}>
                  Pending Withdrawal
                </Text>
                <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: '#ffffff' }}>
                  ₦{walletData.pendingWithdrawal.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: scale(11), color: '#ffffff80', marginBottom: 4 }}>
                  Total Withdrawn
                </Text>
                <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: '#ffffff' }}>
                  ₦{walletData.withdrawn.toLocaleString()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Withdraw Buttons */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
          <View style={{ marginBottom: scale(12) }}>
            <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.secondary, marginBottom: scale(8) }}>
              Quick Withdraw
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: scale(8), flexWrap: 'wrap' }}>
            {[10000, 25000, 50000, 100000].map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => handleQuickWithdrawal(amount)}
                style={{
                  flex: 0.48,
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  borderRadius: scale(8),
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.primary }}>
                  ₦{(amount / 1000).toFixed(0)}k
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bank Accounts */}
        {bankAccounts.length > 0 && (
          <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) }}>
              <Text style={{ fontSize: scale(15), fontWeight: 'bold', color: colors.text }}>
                Bank Accounts
              </Text>
              <TouchableOpacity>
                <MaterialCommunityIcons name="plus" size={scale(20)} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {bankAccounts.map((account, index) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => setSelectedAccount(index)}
                style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  marginBottom: index < bankAccounts.length - 1 ? scale(8) : 0,
                  borderRadius: scale(8),
                  backgroundColor: selectedAccount === index ? colors.primary + '15' : colors.card,
                  borderWidth: selectedAccount === index ? 2 : 1,
                  borderColor: selectedAccount === index ? colors.primary : colors.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                    🏦 {account.name}
                  </Text>
                  <Text style={{ fontSize: scale(11), color: colors.secondary, marginBottom: 2 }}>
                    {account.accountName}
                  </Text>
                  <Text style={{ fontSize: scale(10), color: colors.secondary, fontFamily: 'monospace' }}>
                    {account.accountNumber}
                  </Text>
                </View>
                {selectedAccount === index && (
                  <View style={{ width: scale(20), height: scale(20), borderRadius: scale(10), backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Withdrawal Info */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(20) }}>
          <Card isDark={isDark}>
            <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.text, marginBottom: scale(10) }}>
              Withdrawal Info
            </Text>
            <View style={{ gap: scale(8) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: scale(11), color: colors.secondary }}>
                  Minimum Amount
                </Text>
                <Text style={{ fontSize: scale(11), fontWeight: '600', color: colors.text }}>
                  ₦{walletData.minimumWithdrawal.toLocaleString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: scale(11), color: colors.secondary }}>
                  Processing Time
                </Text>
                <Text style={{ fontSize: scale(11), fontWeight: '600', color: colors.text }}>
                  24-48 hours
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: scale(11), color: colors.secondary }}>
                  Transaction Fee
                </Text>
                <Text style={{ fontSize: scale(11), fontWeight: '600', color: colors.text }}>
                  Free
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Transaction History */}
        <View style={{ paddingHorizontal: scale(20), marginTop: scale(20), marginBottom: scale(12) }}>
          <Text style={{ fontSize: scale(16), fontWeight: 'bold', color: colors.text, marginBottom: scale(12) }}>
            Transaction History
          </Text>

          <FlatList
            data={transactions}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                key={item.id}
                style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(12),
                  marginBottom: index < transactions.length - 1 ? scale(8) : 0,
                  borderRadius: scale(8),
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: scale(20), marginRight: scale(12) }}>
                      {getTransactionIcon(item.type)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.text, marginBottom: 2 }}>
                        {item.description}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                        <Text style={{ fontSize: scale(11), color: colors.secondary }}>
                          {new Date(item.date).toLocaleDateString()}
                        </Text>
                        <View style={{ paddingHorizontal: scale(6), paddingVertical: 2, borderRadius: scale(4), backgroundColor: getStatusColor(item.status) + '15' }}>
                          <Text style={{ fontSize: scale(9), fontWeight: '600', color: getStatusColor(item.status), textTransform: 'capitalize' }}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontSize: scale(14), fontWeight: 'bold', color: item.amount > 0 ? colors.success : colors.error }}>
                    {item.amount > 0 ? '+' : ''}₦{Math.abs(item.amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Withdraw Button */}
        <View style={{ paddingHorizontal: scale(20), gap: scale(12), marginTop: scale(20) }}>
          <Button
            title="Withdraw Funds"
            onPress={() => setShowWithdrawalModal(true)}
            isDark={isDark}
          />
        </View>
      </ScrollView>
      </SafeAreaView>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWithdrawalModal(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' }}
        >
          <SafeAreaView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: scale(20),
              borderTopRightRadius: scale(20),
              paddingHorizontal: scale(20),
              paddingVertical: scale(20),
            }}
          >
            <View
              style={{
                width: scale(40),
                height: scale(4),
                backgroundColor: colors.border,
                borderRadius: scale(2),
                alignSelf: 'center',
                marginBottom: scale(16),
              }}
            />

            <Text
              style={{
                fontSize: scale(18),
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: scale(16),
              }}
            >
              Withdraw Funds
            </Text>

            <View style={{ marginBottom: scale(16) }}>
              <Text style={{ fontSize: scale(12), color: colors.secondary, marginBottom: scale(8), fontWeight: '500' }}>
                Withdrawal Amount
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: scale(8),
                  paddingLeft: scale(12),
                }}
              >
                <Text style={{ fontSize: scale(18), color: colors.text }}>₦</Text>
                <TextInput
                  style={{
                    flex: 1,
                    paddingHorizontal: scale(12),
                    paddingVertical: scale(12),
                    fontSize: scale(16),
                    color: colors.text,
                  }}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.secondary}
                  keyboardType="numeric"
                  value={withdrawalAmount}
                  onChangeText={setWithdrawalAmount}
                />
              </View>
            </View>

            <View
              style={{
                paddingHorizontal: scale(12),
                paddingVertical: scale(10),
                backgroundColor: colors.card,
                borderRadius: scale(6),
                marginBottom: scale(16),
              }}
            >
              <Text style={{ fontSize: scale(11), color: colors.secondary, marginBottom: 4 }}>
                To Account
              </Text>
              <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.text }}>
                🏦 {bankAccounts[selectedAccount]?.name} - {bankAccounts[selectedAccount]?.accountNumber}
              </Text>
            </View>

            <View style={{ gap: scale(8), marginBottom: scale(16) }}>
              {withdrawalAmount && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: scale(8), borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.secondary }}>Amount</Text>
                    <Text style={{ fontWeight: '600', color: colors.text }}>₦{parseInt(withdrawalAmount || '0').toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: scale(8), borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.secondary }}>Fee</Text>
                    <Text style={{ fontWeight: '600', color: colors.text }}>Free</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '600', color: colors.text }}>Total Debit</Text>
                    <Text style={{ fontWeight: 'bold', color: colors.primary }}>₦{parseInt(withdrawalAmount || '0').toLocaleString()}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              <TouchableOpacity
                onPress={() => setShowWithdrawalModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: scale(12),
                  borderRadius: scale(8),
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.text, fontSize: scale(14) }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Button
                  title="Proceed"
                  onPress={handleWithdraw}
                  isDark={isDark}
                />
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      <RiderBottomNavigation />
    </View>
  );
}
