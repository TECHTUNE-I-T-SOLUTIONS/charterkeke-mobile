
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  Linking,
  Alert,
  AppState,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { STORAGE_KEYS } from '@/utils/constants';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { PaystackPaymentModal } from '@/components/PaystackPaymentModal';
import { BRAND, COLORS } from '@/utils/colors';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  source: string;
  created_at: string;
  title?: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [walletData, setWalletData] = useState<{ balance: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const renderedOnce = useRef(false);
  const [hasCached, setHasCached] = useState(false);
  const [settlementInfo, setSettlementInfo] = useState<any>(null);
  const [outstandingDetails, setOutstandingDetails] = useState<any[]>([]);
  const [expandedSettlements, setExpandedSettlements] = useState<Record<string, boolean>>({});
  const [settlementReference, setSettlementReference] = useState<string | null>(null);
  const [settlementPaying, setSettlementPaying] = useState(false);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string>('');
  const [paystackAmount, setPaystackAmount] = useState(0);

  const isLight = theme.mode === 'light';

  const getDailyRemittanceDue = () => {
    const explicitOutstanding = Number(
      earningsData?.outstanding_platform_fee ?? earningsData?.settlement?.outstandingPlatformFees ?? 0
    );
    if (explicitOutstanding > 0) return explicitOutstanding;

    const status = earningsData?.settlement_status;
    const platformFee = Number(earningsData?.total_platform_fee || 0);
    if (status === 'paid') return 0;
    return platformFee;
  };

  const getSettlementPaidDate = () => {
    return (
      earningsData?.last_payment_date ||
      earningsData?.settlement?.lastPaymentDate ||
      earningsData?.settlement?.paid_at ||
      null
    );
  };

  const normalizeTransaction = (item: any, index: number): Transaction => {
    const amount = Number(item?.amount ?? item?.fare_amount ?? item?.driver_earnings ?? 0);
    const source = item?.source || (item?.fare_amount != null || item?.driver_earnings != null ? 'ride' : 'withdrawal');
    const createdAt = item?.created_at || item?.accepted_at || item?.completed_at || new Date().toISOString();
    const parsed = new Date(createdAt);

    return {
      id: String(item?.id || item?.ride_id || `tx_${index}_${createdAt}`),
      amount,
      transaction_type: item?.transaction_type || (source === 'ride' ? 'credit' : 'debit'),
      source,
      created_at: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
      title: source === 'ride'
        ? `${item?.pickup_zone || 'Pickup'} → ${item?.destination_zone || 'Destination'}`
        : 'Withdrawal',
    };
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toDateString();
  };

  // Prefer settlementInfo.totalOutstanding when present (even if 0), otherwise fall back to today's computed remittance
  const totalOutstandingDisplay = settlementInfo && typeof settlementInfo.totalOutstanding !== 'undefined'
    ? Number(settlementInfo.totalOutstanding || 0)
    : getDailyRemittanceDue();

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadWallet();
      }
      // Check for pending payment verification when screen comes to focus
      checkPendingPayment();
    }, [])
  );

  // Handle deep links from Paystack payment callback
  React.useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log('🔗 [DEEP_LINK] Handling deep link:', url);
      const route = url.replace(/.*?:\/\//g, '');
      const routeParts = route.split('?')[0].split('/');
      
      if (routeParts[0] === 'payment-callback') {
        const reference = routeParts[1];
        if (reference) {
          console.log('💳 [DEEP_LINK] Payment callback with reference:', reference);
          setSettlementReference(reference);
          checkPaymentStatus(reference);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const checkPaymentStatus = async (reference: string) => {
    try {
      console.log('🔄 [DEEP_LINK] Checking payment status:', reference);
      const result = await apiService.verifyDriverSettlementPayment(reference);
      
      if (result?.paymentStatus === 'success') {
        console.log('✅ [DEEP_LINK] Payment verified');
        setSettlementReference(null);
        await cacheService.remove('paystack_pending_reference');
        await fetchSettlementStatus();
        await fetchEarningsForToday(true);
        Alert.alert('✅ Payment Successful', 'Your settlement has been paid. You can now accept rides.');
      } else if (['failed', 'cancelled'].includes(result?.paymentStatus)) {
        console.log('❌ [DEEP_LINK] Payment failed:', result?.paymentStatus);
        setSettlementReference(null);
        Alert.alert('Payment Failed', `Status: ${result?.paymentStatus}`);
      } else {
        console.log('⏳ [DEEP_LINK] Payment pending:', result?.paymentStatus);
        // Keep checking periodically
        startPaymentStatusPolling(reference);
      }
    } catch (error) {
      console.error('[DEEP_LINK] Error checking payment:', error);
    }
  };

  const handlePaystackSuccess = async () => {
    console.log('🎉 [PAYSTACK_MODAL] Payment successful, verifying...');
    try {
      if (!settlementReference) return;
      
      setSettlementPaying(true);
      const result = await apiService.verifyDriverSettlementPayment(settlementReference);
      
      if (result?.paymentStatus === 'success') {
        setSettlementReference(null);
        await cacheService.remove('paystack_pending_reference');
        await fetchSettlementStatus();
        await fetchEarningsForToday(true);
        setShowPaystackModal(false);
        setPaystackAuthUrl('');
        setPaystackAmount(0);
        Alert.alert('✅ Payment Successful', 'Your settlement has been paid. You can now accept rides.');
      } else {
        Alert.alert('Payment Status', `Status: ${result?.paymentStatus}`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      Alert.alert('Verification Failed', 'Unable to verify payment. Please try again.');
    } finally {
      setSettlementPaying(false);
    }
  };

  const handlePaystackError = (error: string) => {
    console.error('🔴 [PAYSTACK_MODAL] Error:', error);
    Alert.alert('Payment Error', error || 'An error occurred during payment.');
  };

  const handlePaystackClose = () => {
    setShowPaystackModal(false);
    setPaystackAuthUrl('');
    setPaystackAmount(0);
  };

  const loadWallet = async () => {
    const cached = await cacheService.get<any>('driver_wallet');
    if (cached) {
      setWalletData(cached.walletData || null);
      setTransactions(cached.transactions || []);
      setHasCached(true);
      setLoading(false);
    }

    const settlementCache = await cacheService.get<any>(STORAGE_KEYS.DRIVER_SETTLEMENT);
    if (settlementCache) {
      setSettlementInfo(settlementCache);
    }

    // Don't use cache for earnings on initial load - force fresh data
    await Promise.all([
      fetchWalletData(!cached),
      fetchSettlementStatus(),
      fetchEarningsForToday(true), // forceRefresh=true on mount
    ]);
  };

  const fetchWalletData = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const [allEarnings, txResponse] = await Promise.all([
        apiService.getEarnings('all').catch(() => ({ earnings: {} })),
        apiService.getTransactions(1).catch(() => ({ transactions: [] })),
      ]);

      const balance = Number(allEarnings?.earnings?.total_ride_earnings || 0);
      setWalletData({ balance });

      const rawTransactions = txResponse.transactions || txResponse.rides || [];
      const nextTransactions = (Array.isArray(rawTransactions) ? rawTransactions : []).map(normalizeTransaction);
      setTransactions(nextTransactions);

      await cacheService.set('driver_wallet', {
        walletData: { balance },
        transactions: nextTransactions,
      });
    } catch (error) { console.error(error); } 
    finally { if (showLoader) setLoading(false); }
  };

  const fetchSettlementStatus = async () => {
    try {
      // Auto-verify all pending payments before checking settlement status
      try {
        console.log('[Wallet] Auto-verifying pending payments...');
        const verifyResult = await apiService.verifyAllPendingPayments(user?.id);
        if (verifyResult?.updated > 0) {
          console.log(`[Wallet] ✅ Verified and updated ${verifyResult.updated} payments`);
        }
      } catch (verifyError) {
        console.log('[Wallet] Payment verification error (non-critical):', verifyError);
      }

      const data = await apiService.getDriverSettlementStatus();
      setSettlementInfo(data);
      await cacheService.set(STORAGE_KEYS.DRIVER_SETTLEMENT, data);
      // fetch details (rides) for each outstanding settlement so Wallet can show per-ride breakdown
      try {
        await fetchOutstandingDetails(data?.outstandingSettlements || []);
      } catch (err) {
        console.error('fetchOutstandingDetails error:', err);
      }
    } catch (error: any) {
      console.error('Settlement status error:', error);
      try {
        const daily = await apiService.getDriverDailySettlement();
        const fallback = {
          blocked: Number(daily?.totals?.platformFee || 0) > 0,
          totalOutstanding: Number(daily?.totals?.platformFee || 0),
          currentSettlement: daily?.settlement || null,
          outstandingSettlements: daily?.settlement ? [daily.settlement] : [],
          source: 'daily-fallback',
        };
        setSettlementInfo(fallback);
        await cacheService.set(STORAGE_KEYS.DRIVER_SETTLEMENT, fallback);
      } catch (fallbackError) {
        console.error('Daily settlement fallback error:', fallbackError);
      }
    }
  };

  const fetchOutstandingDetails = async (list: any[]) => {
    try {
      if (!Array.isArray(list) || list.length === 0) {
        setOutstandingDetails([]);
        return [];
      }

      const details = await Promise.all(
        list.map(async (s: any) => {
          try {
            const resp = await apiService.get(`/driver/settlement/rides?settlement_id=${s.id}`);
            return { settlement: s, daily: resp };
          } catch (err) {
            console.error('Error fetching settlement rides for', s.id, err);
            return { settlement: s, daily: null };
          }
        })
      );

      setOutstandingDetails(details);
      return details;
    } catch (err) {
      console.error('fetchOutstandingDetails failed', err);
      setOutstandingDetails([]);
      return [];
    }
  };

  /* removed: quick settlement check consolidated into getDriverSettlementStatus() */

  const fetchEarningsForToday = async (forceRefresh: boolean = false) => {
    try {
      // Skip cache on force refresh or initial load
      if (!forceRefresh && !earningsData) {
        const cached = await cacheService.get<any>('driver_earnings_today');
        if (cached) {
          setEarningsData(cached);
          // Still fetch fresh data in background
          apiService.getDriverDailySettlement().then(daily => {
            const nextData = {
              date: daily?.date || new Date().toISOString().slice(0, 10),
              settlement_status: daily?.settlement?.status || 'pending',
              total_rides_accepted: Number(daily?.settlement?.totalRides || daily?.totals?.acceptedRides || 0),
              total_ride_earnings: Number(daily?.settlement?.totalFareAmount || daily?.totals?.grossAmount || 0),
              total_platform_fee: Number(daily?.settlement?.totalPlatformFees || daily?.totals?.platformFee || 0),
              total_driver_earnings: Number(daily?.settlement?.totalDriverEarnings || daily?.totals?.netDriverEarnings || 0),
              outstanding_platform_fee: Number(daily?.settlement?.outstandingPlatformFees || daily?.paymentSummary?.outstandingPlatformFees || 0),
              paid_platform_fee: Number(daily?.settlement?.paidPlatformFees || daily?.paymentSummary?.paidPlatformFees || 0),
              last_payment_date: daily?.settlement?.lastPaymentDate || daily?.paymentSummary?.lastPaymentDate || null,
              settlement: daily?.settlement || null,
              rides: daily?.rides || [],
            };
            setEarningsData(nextData);
            cacheService.set('driver_earnings_today', nextData);
          }).catch(err => console.error('Background earnings fetch error:', err));
          return cached;
        }
      }

      const daily = await apiService.getDriverDailySettlement();
      const nextData = {
        date: daily?.date || new Date().toISOString().slice(0, 10),
        settlement_status: daily?.settlement?.status || 'pending',
        total_rides_accepted: Number(daily?.settlement?.totalRides || daily?.totals?.acceptedRides || 0),
        total_ride_earnings: Number(daily?.settlement?.totalFareAmount || daily?.totals?.grossAmount || 0),
        total_platform_fee: Number(daily?.settlement?.totalPlatformFees || daily?.totals?.platformFee || 0),
        total_driver_earnings: Number(daily?.settlement?.totalDriverEarnings || daily?.totals?.netDriverEarnings || 0),
        outstanding_platform_fee: Number(daily?.settlement?.outstandingPlatformFees || daily?.paymentSummary?.outstandingPlatformFees || 0),
        paid_platform_fee: Number(daily?.settlement?.paidPlatformFees || daily?.paymentSummary?.paidPlatformFees || 0),
        last_payment_date: daily?.settlement?.lastPaymentDate || daily?.paymentSummary?.lastPaymentDate || null,
        settlement: daily?.settlement || null,
        rides: daily?.rides || [],
      };
      setEarningsData(nextData);
      await cacheService.set('driver_earnings_today', nextData);
      return nextData;
    } catch (error) {
      console.error('Earnings fetch error:', error);
      return null;
    }
  };

  const handlePaySettlement = async () => {
    try {
      // Check total outstanding (including all past unpaid settlements)
      const settlementStatus = settlementInfo || await apiService.getDriverSettlementStatus();
      const totalOutstanding = Number(settlementStatus?.totalOutstanding || 0);
      
      if (totalOutstanding <= 0) {
        Alert.alert('No Remittance Due', 'All settlement fees have been paid.');
        return;
      }

      setSettlementPaying(true);
      // Don't pass date - let backend determine all outstanding settlements
      const data = await apiService.initiateDriverSettlementPayment();
      const authUrl = data?.authUrl;
      const reference = data?.reference;
      
      if (!authUrl) {
        throw new Error('Payment link not available');
      }

      setSettlementReference(reference || null);
      
      // Store reference for verification when app reopens
      if (reference) {
        await cacheService.set('paystack_pending_reference', reference);
      }

      // Show in-app payment modal instead of opening browser
      setPaystackAuthUrl(authUrl);
      setPaystackAmount(totalOutstanding);
      setShowPaystackModal(true);
    } catch (error) {
      console.error('Settlement payment error:', error);
      Alert.alert('Payment Failed', 'Unable to start payment. Please try again.');
    } finally {
      setSettlementPaying(false);
    }
  };

  const startPaymentStatusPolling = async (reference: string, timeoutMs: number = 120000) => {
    const startTime = Date.now();
    const pollInterval = setInterval(async () => {
      try {
        // Check if timeout exceeded
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(pollInterval);
          console.log('📊 [POLLING] Timeout - stopping payment status polling');
          return;
        }

        const result = await apiService.verifyDriverSettlementPayment(reference);
        
        if (result?.paymentStatus === 'success') {
          clearInterval(pollInterval);
          console.log('✅ [POLLING] Payment verified successfully');
          setSettlementReference(null);
          await cacheService.remove('paystack_pending_reference');
          await fetchSettlementStatus();
          await fetchEarningsForToday(true);
          Alert.alert('✅ Payment Successful', 'Your settlement has been paid. You can now accept rides.');
        } else if (['failed', 'cancelled'].includes(result?.paymentStatus)) {
          clearInterval(pollInterval);
          console.log('❌ [POLLING] Payment failed:', result?.paymentStatus);
          setSettlementReference(null);
          Alert.alert('Payment Failed', `Payment status: ${result?.paymentStatus}`);
        }
      } catch (error) {
        console.log('📊 [POLLING] Check scheduled, will retry...', error);
        // Continue polling on error - payment might still be processing
      }
    }, 3000); // Poll every 3 seconds
  };

  const checkPendingPayment = async () => {
    try {
      const pendingRef = await cacheService.get<string>('paystack_pending_reference');
      if (pendingRef) {
        console.log('🔄 [VERIFY] Found pending payment reference:', pendingRef);
        setSettlementReference(pendingRef);
        
        const result = await apiService.verifyDriverSettlementPayment(pendingRef);
        
        if (result?.paymentStatus === 'success') {
          console.log('✅ [VERIFY] Pending payment completed');
          setSettlementReference(null);
          await cacheService.remove('paystack_pending_reference');
          await fetchSettlementStatus();
          await fetchEarningsForToday(true);
          Alert.alert('✅ Payment Successful', 'Your settlement has been paid. You can now accept rides.');
        } else if (['failed', 'cancelled'].includes(result?.paymentStatus)) {
          console.log('❌ [VERIFY] Pending payment failed:', result?.paymentStatus);
          setSettlementReference(null);
          await cacheService.remove('paystack_pending_reference');
          Alert.alert('Payment Failed', `Status: ${result?.paymentStatus}`);
        } else {
          console.log('⏳ [VERIFY] Payment still processing:', result?.paymentStatus);
          // Still polling, keep reference stored
        }
      }
    } catch (error) {
      console.error('Check pending payment error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWalletData(!hasCached),
      fetchSettlementStatus(),
      fetchEarningsForToday(true) // forceRefresh=true on pull-to-refresh
    ]);
    setRefreshing(false);
  };

  if (loading) return <SafeAreaView style={{flex:1, backgroundColor: theme.colors.background}}><ListScreenSkeleton itemCount={4}/></SafeAreaView>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Wallet</Text>
        </View>

        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={styles.paddingH}>
            <LinearGradient
              colors={['#D67E0B', '#D67E0A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Available Balance</Text>
                <MaterialCommunityIcons name="wallet-outline" size={24} color="rgba(0,0,0,0.5)" />
              </View>
              <Text style={styles.balanceText}>₦{((walletData?.balance) ?? 0).toLocaleString('en-US')}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardNumber}>**** **** **** 8829</Text>
                <Text style={styles.cardBrand}>Charter Keke</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Settlement Card */}
          <View style={[styles.paddingH, { marginTop: 20 }]}>
            <View style={[styles.settlementCard, { backgroundColor: theme.colors.ride, borderColor: theme.colors.border }]}
            >
              <View style={styles.settlementHeader}>
                <View>
                  <Text style={[styles.settlementTitle, { color: theme.colors.textPrimary }]}>Platform Remittance</Text>
                  <Text style={[styles.settlementSub, { color: theme.colors.textSecondary }]}>
                    {getDailyRemittanceDue() > 0
                      ? 'Today\'s platform fee due'
                      : getSettlementPaidDate()
                        ? `Paid for ${earningsData?.date || 'today'} on ${formatDisplayDate(getSettlementPaidDate())}`
                        : `No remittance due for ${earningsData?.date || 'today'}`}
                  </Text>
                </View>
                <MaterialCommunityIcons name="cash-check" size={24} color={BRAND.primary} />
              </View>

              <View style={styles.settlementAmountRow}>
                <Text style={[styles.settlementAmount, { color: theme.colors.textPrimary }]}>₦{totalOutstandingDisplay.toLocaleString('en-US')}</Text>
                <Text style={[styles.settlementBadge, { color: totalOutstandingDisplay > 0 ? '#FF9101' : '#10B981' }]}>
                  {totalOutstandingDisplay > 0 ? 'DUE NOW' : 'PAID'}
                </Text>
              </View>

              {(totalOutstandingDisplay > 0) && ((settlementInfo?.outstandingSettlements?.length) > 0) && (
                <Text style={[styles.settlementSub, { color: '#FF9101', marginBottom: 10 }]}>
                  { (settlementInfo?.outstandingSettlements?.length ?? 0) } overdue settlement(s): ₦{Number(settlementInfo?.totalOutstanding ?? 0).toLocaleString('en-US')}
                </Text>
              )}

              <View style={styles.settlementActions}>
                <TouchableOpacity
                  onPress={handlePaySettlement}
                  disabled={settlementPaying || totalOutstandingDisplay <= 0}
                  style={[
                    styles.settlementBtn,
                    { backgroundColor: totalOutstandingDisplay > 0 ? BRAND.primary : theme.colors.border },
                    { flex: 1.5 },
                  ]}
                >
                  <Text style={[styles.settlementBtnText, { color: totalOutstandingDisplay > 0 ? '#000' : theme.colors.textSecondary }]}>
                    {settlementPaying ? 'Processing...' : 'Pay Now'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/driver/payment-history')}
                  style={[styles.settlementBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, flex: 1 }]}
                >
                  <MaterialCommunityIcons name="history" size={18} color={theme.colors.textPrimary} />
                  <Text style={[styles.settlementBtnText, { color: theme.colors.textPrimary, marginLeft: 4 }]}>History</Text>
                </TouchableOpacity>
                {settlementReference && (
                  <TouchableOpacity
                    onPress={checkPendingPayment}
                    disabled={settlementPaying}
                    style={[styles.settlementBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, flex: 1 }]}
                  >
                    <Text style={[styles.settlementBtnText, { color: theme.colors.textPrimary }]}>Check</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

              {/* Older Outstanding Remittances */}
              {((settlementInfo?.outstandingSettlements?.length) ?? 0) > 0 && (
                <View style={[styles.paddingH, { marginTop: 12 }]}>
                  <View style={[styles.settlementCard, { backgroundColor: theme.colors.ride, borderColor: theme.colors.border }]}>
                    <View style={styles.settlementHeader}>
                      <View>
                        <Text style={[styles.settlementTitle, { color: theme.colors.textPrimary }]}>Outstanding Remittances</Text>
                        <Text style={[styles.settlementSub, { color: theme.colors.textSecondary }]}>Older unpaid remittances requiring payment</Text>
                      </View>
                      <MaterialCommunityIcons name="calendar-clock" size={22} color={BRAND.primary} />
                    </View>

                    <View style={styles.outstandingList}>
                          {outstandingDetails.length > 0 ? (
                            outstandingDetails.map(({ settlement, daily }: any) => (
                              <View key={settlement.id} style={[styles.outstandingItem, { borderBottomColor: theme.colors.border }]}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.outstandingDate, { color: theme.colors.textPrimary }]}>{formatDisplayDate(settlement.settlement_date)}</Text>
                                  <Text style={[styles.settlementSub, { color: theme.colors.textSecondary }]}>
                                    Due: {formatDisplayDate(settlement.payment_due_date)} • {settlement.settlement_status}
                                  </Text>
                                  {daily?.rides && daily.rides.length > 0 && (
                                    <View style={{ marginTop: 8 }}>
                                      {(() => {
                                        const isExpanded = !!expandedSettlements[settlement.id];
                                        const visible = isExpanded ? daily.rides : daily.rides.slice(0, 5);
                                        return (
                                          <>
                                            {visible.map((r: any) => (
                                              <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{(r.pickup_zone || 'Pickup')} → {(r.destination_zone || 'Destination')}</Text>
                                                <Text style={{ color: '#FF9101', fontSize: 12 }}>₦{Number(r.platform_fee || 0).toLocaleString('en-US')}</Text>
                                              </View>
                                            ))}
                                            {daily.rides.length > 5 && (
                                              <TouchableOpacity onPress={() => setExpandedSettlements(prev => ({ ...prev, [settlement.id]: !prev[settlement.id] }))}>
                                                <Text style={{ color: BRAND.primary, fontSize: 12, marginTop: 6 }}>{isExpanded ? 'Show less' : `Show ${daily.rides.length - 5} more`}</Text>
                                              </TouchableOpacity>
                                            )}
                                          </>
                                        )
                                      })()}
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.outstandingAmount, { color: '#FF9101' }]}>₦{Number(settlement.total_platform_fees || 0).toLocaleString('en-US')}</Text>
                              </View>
                            ))
                          ) : (
                            settlementInfo.outstandingSettlements.map((s: any) => (
                              <View key={s.id} style={[styles.outstandingItem, { borderBottomColor: theme.colors.border }]}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.outstandingDate, { color: theme.colors.textPrimary }]}>{formatDisplayDate(s.settlement_date)}</Text>
                                  <Text style={[styles.settlementSub, { color: theme.colors.textSecondary }]}>Due: {formatDisplayDate(s.payment_due_date)} • {s.settlement_status}</Text>
                                </View>
                                <Text style={[styles.outstandingAmount, { color: '#FF9101' }]}>₦{Number(s.total_platform_fees || 0).toLocaleString('en-US')}</Text>
                              </View>
                            ))
                          )}
                    </View>
                  </View>
                </View>
              )}
          </View>

          {/* Daily Accepted Rides (Remittance Basis) */}
          <View style={[styles.paddingH, { marginTop: 20 }]}>
            <View style={[styles.settlementCard, { backgroundColor: theme.colors.ride, borderColor: theme.colors.border }]}>
              <View style={styles.settlementHeader}>
                <View>
                  <Text style={[styles.settlementTitle, { color: theme.colors.textPrimary }]}>Today's Accepted Rides</Text>
                  <Text style={[styles.settlementSub, { color: theme.colors.textSecondary }]}>Used to calculate daily remittance</Text>
                </View>
                <MaterialCommunityIcons name="car-clock" size={24} color={BRAND.primary} />
              </View>

              <View style={styles.rideSummaryRow}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Accepted</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>{earningsData?.total_rides_accepted || 0}</Text>
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Gross</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>₦{Number(earningsData?.total_ride_earnings || 0).toLocaleString('en-US')}</Text>
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Fee</Text>
                  <Text style={[styles.summaryValue, { color: '#FF9101' }]}>₦{Number(earningsData?.total_platform_fee || 0).toLocaleString('en-US')}</Text>
                </View>
              </View>

              {/* Use today's earnings data for rides list */}
              {((earningsData?.rides?.length ?? 0)) > 0 ? (
                <View style={styles.ridesListWrap}>
                  {(earningsData?.rides || []).slice(0, 10).map((ride: any) => (
                    <View key={ride.id} style={[styles.rideItem, { borderBottomColor: theme.colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.rideRoute, { color: theme.colors.textPrimary }]}>
                          {ride.pickup_zone || 'Pickup'} → {ride.destination_zone || 'Destination'}
                        </Text>
                        <Text style={[styles.rideMeta, { color: theme.colors.textSecondary }]}>
                          {ride.status || 'completed'} • {formatDisplayDate(ride.completed_at || ride.created_at || ride.accepted_at)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.rideAmount, { color: BRAND.primary }]}>₦{Number(ride.fare_amount || 0).toLocaleString('en-US')}</Text>
                        <Text style={[styles.rideFee, { color: '#FF9101' }]}>Fee: ₦{Number(ride.platform_fee || 0).toLocaleString('en-US')}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={{ color: theme.colors.textSecondary }}>No accepted rides for today yet.</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => router.push('/driver/payment-history')}
                style={[styles.settlementBtn, { marginTop: 12, backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }]}
              >
                <MaterialCommunityIcons name="history" size={18} color={theme.colors.textPrimary} />
                <Text style={[styles.settlementBtnText, { color: theme.colors.textPrimary, marginLeft: 6 }]}>Remittance History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions - Withdraw removed (not offered) */}
          <View style={[styles.actionRow, styles.paddingH]}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => router.push('/driver/payment-history')}
              style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
               <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                 <MaterialCommunityIcons name="history" size={24} color="#FFFDFB" />
               </View>
               <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions */}
          <View style={[styles.paddingH, { marginTop: 24 }]}>
             <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Activity</Text>
             {transactions.length === 0 ? (
               <View style={styles.emptyState}>
                 <Text style={{ color: theme.colors.textSecondary }}>No transactions yet.</Text>
               </View>
             ) : (
               transactions.map((tx) => (
                 <View key={tx.id} style={[styles.txItem, { borderBottomColor: theme.colors.border }]}>
                   <View style={[styles.txIcon, { backgroundColor: theme.colors.inputBackground }]}>
                     <MaterialCommunityIcons 
                        name={tx.transaction_type === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} 
                        size={20} 
                        color={tx.transaction_type === 'credit' ? '#834F0C' : '#FF9101'} 
                     />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.txTitle, { color: theme.colors.textPrimary }]}>
                       {tx.source === 'ride' ? (tx.title || 'Ride Earning') : 'Withdrawal'}
                     </Text>
                     <Text style={[styles.txDate, { color: theme.colors.textSecondary }]}>{formatDisplayDate(tx.created_at)}</Text>
                   </View>
                   <Text style={[styles.txAmount, { color: tx.transaction_type === 'credit' ? '#834F0C' : theme.colors.textPrimary }]}>
                     {tx.transaction_type === 'credit' ? '+' : '-'}₦{Number(tx.amount ?? 0).toLocaleString('en-US')}
                   </Text>
                 </View>
               ))
             )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Paystack Payment Modal */}
      <PaystackPaymentModal
        visible={showPaystackModal}
        authUrl={paystackAuthUrl}
        reference={settlementReference || ''}
        amount={paystackAmount}
        onSuccess={handlePaystackSuccess}
        onError={handlePaystackError}
        onClose={handlePaystackClose}
      />

        {/* Withdraw removed - feature not offered */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  paddingH: { paddingHorizontal: 20 },
  cardGradient: { borderRadius: 20, padding: 24, height: 180, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#000', opacity: 0.7 },
  balanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#271702',
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardNumber: { fontFamily: 'monospace', opacity: 0.6, color: '#000' },
  cardBrand: { fontWeight: '700', color: '#000' },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txTitle: { fontWeight: '600' },
  txDate: { fontSize: 12 },
  txAmount: { fontWeight: '700', fontSize: 16 },
  emptyState: { padding: 20, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: { padding: 16, borderRadius: 12, fontSize: 18, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  settlementCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  settlementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settlementTitle: { fontSize: 16, fontWeight: '700' },
  settlementSub: { fontSize: 12 },
  settlementAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  settlementAmount: { fontSize: 22, fontWeight: '800' },
  settlementBadge: { fontSize: 12, fontWeight: '700' },
  settlementActions: { flexDirection: 'row', gap: 12 },
  settlementBtn: { flex: 1, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  settlementBtnText: { fontWeight: '700' },
  rideSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  ridesListWrap: { borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.25)', paddingTop: 8 },
  rideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  rideRoute: { fontSize: 13, fontWeight: '600' },
  rideMeta: { fontSize: 11, marginTop: 2 },
  rideAmount: { fontSize: 13, fontWeight: '700' },
  rideFee: { fontSize: 11, marginTop: 2 }
  ,
  outstandingList: { paddingTop: 8 },
  outstandingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  outstandingDate: { fontSize: 13, fontWeight: '700' },
  outstandingAmount: { fontSize: 13, fontWeight: '800' },
});
