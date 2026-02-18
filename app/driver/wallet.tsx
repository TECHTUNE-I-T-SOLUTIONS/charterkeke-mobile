
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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { BRAND, COLORS } from '@/utils/colors';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  source: string;
  created_at: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [walletData, setWalletData] = useState<{ balance: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const renderedOnce = useRef(false);
  const [hasCached, setHasCached] = useState(false);

  const isLight = theme.mode === 'light';

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadWallet();
      }
    }, [])
  );

  const loadWallet = async () => {
    const cached = await cacheService.get<any>('driver_wallet');
    if (cached) {
      setWalletData(cached.walletData || null);
      setTransactions(cached.transactions || []);
      setHasCached(true);
      setLoading(false);
    }

    await fetchWalletData(!cached);
  };

  const fetchWalletData = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const paymentStatus = user?.id
        ? await apiService.getPaymentStatus(user.id)
        : await apiService.getWallet();
      const balance =
        paymentStatus?.wallet?.balance ??
        paymentStatus?.balance ??
        paymentStatus?.available_balance ??
        paymentStatus?.availableBalance ??
        0;
      setWalletData({ balance });

      const txResponse = await apiService.getTransactions(1).catch(() => ({ transactions: [] }));
      const nextTransactions = txResponse.transactions || txResponse.rides || [];
      setTransactions(nextTransactions);

      await cacheService.set('driver_wallet', {
        walletData: { balance },
        transactions: nextTransactions,
      });
    } catch (error) { console.error(error); } 
    finally { if (showLoader) setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData(!hasCached);
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
              colors={[BRAND.primary, '#E68200']}
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

          {/* Quick Actions */}
          <View style={[styles.actionRow, styles.paddingH]}>
            <TouchableOpacity onPress={() => setShowWithdraw(true)} style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
               <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
                 <MaterialCommunityIcons name="bank-transfer-out" size={24} color="#EF4444" />
               </View>
               <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
               <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                 <MaterialCommunityIcons name="history" size={24} color="#10B981" />
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
                        color={tx.transaction_type === 'credit' ? '#10B981' : '#EF4444'} 
                     />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.txTitle, { color: theme.colors.textPrimary }]}>
                       {tx.source === 'ride' ? 'Ride Earning' : 'Withdrawal'}
                     </Text>
                     <Text style={[styles.txDate, { color: theme.colors.textSecondary }]}>{new Date(tx.created_at).toDateString()}</Text>
                   </View>
                   <Text style={[styles.txAmount, { color: tx.transaction_type === 'credit' ? '#10B981' : theme.colors.textPrimary }]}>
                     {tx.transaction_type === 'credit' ? '+' : '-'}₦{(tx.amount ?? 0).toLocaleString('en-US')}
                   </Text>
                 </View>
               ))
             )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Withdraw Modal Placeholder */}
      <Modal visible={showWithdraw} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Withdraw Funds</Text>
                <TextInput 
                   placeholder="Enter Amount" 
                   placeholderTextColor={theme.colors.textTertiary}
                   style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.textPrimary }]} 
                   keyboardType="numeric"
                />
                <View style={styles.modalBtns}>
                    <TouchableOpacity onPress={() => setShowWithdraw(false)} style={[styles.modalBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}>
                        <Text style={{ color: theme.colors.textPrimary }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowWithdraw(false)} style={[styles.modalBtn, { backgroundColor: BRAND.primary }]}>
                        <Text style={{ color: '#000', fontWeight: 'bold' }}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

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
  balanceText: { fontSize: 36, fontWeight: '800', color: '#000' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardNumber: { fontFamily: 'monospace', opacity: 0.6 },
  cardBrand: { fontWeight: '700' },
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
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' }
});
