
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
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
import { BRAND, COLORS } from '@/utils/colors';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'payout' | 'refund';
  source: string;
  status: string;
  description: string;
  created_at: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<{ balance: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const renderedOnce = useRef(false);
  const [hasCached, setHasCached] = useState(false);

  const isLight = theme.mode === 'light';

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadWalletData();
      }
    }, [])
  );

  const loadWalletData = async () => {
    const cached = await cacheService.get<any>(STORAGE_KEYS.RIDER_WALLET);
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
      const data = await apiService.get('/user/wallet');
      const nextWallet = (data as any)?.wallet || null;
      const nextTransactions = (data as any)?.transactions || [];
      setWalletData(nextWallet);
      setTransactions(nextTransactions);

      await cacheService.set(STORAGE_KEYS.RIDER_WALLET, {
        walletData: nextWallet,
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

  const getTxColor = (type: string) => (type === 'credit' || type === 'refund') ? '#10B981' : '#EF4444';
  const getTxIcon = (type: string) => (type === 'credit' || type === 'refund') ? 'arrow-down-circle' : 'arrow-up-circle';

  if (loading) return <SafeAreaView style={{flex:1, backgroundColor: theme.colors.background}}><ListScreenSkeleton itemCount={4}/></SafeAreaView>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Wallet</Text>
           <TouchableOpacity style={[styles.historyBtn, { backgroundColor: theme.colors.inputBackground }]}>
             <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.textSecondary} />
           </TouchableOpacity>
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
                <MaterialCommunityIcons name="integrated-circuit-chip" size={32} color="rgba(0,0,0,0.4)" />
              </View>
              <Text style={styles.balanceText}>₦{walletData?.balance?.toLocaleString() || '0.00'}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardNumber}>**** **** **** 1234</Text>
                <Text style={styles.cardBrand}>Charter Keke</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={[styles.actionRow, styles.paddingH]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
               <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                 <MaterialCommunityIcons name="plus" size={24} color="#10B981" />
               </View>
               <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
               <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
                 <MaterialCommunityIcons name="bank-transfer" size={24} color="#EF4444" />
               </View>
               <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions */}
          <View style={[styles.paddingH, { marginTop: 24 }]}>
             <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Transactions</Text>
             {transactions.length === 0 ? (
               <View style={styles.emptyState}>
                 <Text style={{ color: theme.colors.textSecondary }}>No transactions yet.</Text>
               </View>
             ) : (
               transactions.map((tx) => (
                 <View key={tx.id} style={[styles.txItem, { borderBottomColor: theme.colors.border }]}>
                   <View style={[styles.txIcon, { backgroundColor: theme.colors.inputBackground }]}>
                     <MaterialCommunityIcons name={getTxIcon(tx.transaction_type)} size={20} color={getTxColor(tx.transaction_type)} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.txTitle, { color: theme.colors.textPrimary }]}>
                       {tx.source === 'ride' ? 'Ride Payment' : tx.source === 'deposit' ? 'Top Up' : 'Withdrawal'}
                     </Text>
                     <Text style={[styles.txDate, { color: theme.colors.textSecondary }]}>{new Date(tx.created_at).toDateString()}</Text>
                   </View>
                   <Text style={[styles.txAmount, { color: getTxColor(tx.transaction_type) }]}>
                     {tx.transaction_type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                   </Text>
                 </View>
               ))
             )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  historyBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  paddingH: { paddingHorizontal: 20 },
  cardGradient: { borderRadius: 20, padding: 24, minHeight: 180, justifyContent: 'space-between', elevation: 8, shadowColor: BRAND.primary, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.3, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { color: '#000', opacity: 0.7, fontWeight: '600' },
  balanceText: { color: '#000', fontSize: 36, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: '#000', opacity: 0.6, fontSize: 14, fontFamily: 'monospace' },
  cardBrand: { color: '#000', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  emptyState: { padding: 20, alignItems: 'center' },
});
