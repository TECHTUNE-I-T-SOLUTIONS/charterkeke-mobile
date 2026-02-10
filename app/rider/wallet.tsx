import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@/utils/colors';

interface WalletData {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'payout' | 'refund';
  source: string;
  status: string;
  description: string;
  created_at: string;
  ride_id?: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isDark = theme?.mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/wallet');
      const data = await res.json();
      setWalletData(data.wallet);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  // Memoized stats
  const stats = useMemo(() => {
    const totalCredit = transactions
      .filter((t) => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactions
      .filter((t) => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalCredit, totalDebit };
  }, [transactions]);

  // Memoized gradient colors
  const headerGradient = useMemo(
    () => [
      isDark ? '#FFFFFF' : '#000000',
      isDark ? '#F0F0F0' : '#333333',
    ],
    [isDark]
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'plus-circle';
      case 'debit':
        return 'minus-circle';
      case 'payout':
        return 'bank-transfer';
      case 'refund':
        return 'undo';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return '#10B981';
      case 'debit':
        return '#EF4444';
      case 'payout':
        return '#8B5CF6';
      case 'refund':
        return '#3B82F6';
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: isDark ? '#000000' : '#FFFFFF',
                marginLeft: 12,
                flex: 1,
              }}
            >
              My Wallet
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#666666' : '#CCCCCC',
              fontWeight: '500',
            }}
          >
            Manage your funds and transactions
          </Text>
        </LinearGradient>

        {/* Balance Card */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <LinearGradient
            colors={[colors.primary || '#00CCFF', colors.primary || '#00CCFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 24,
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons
                name="wallet"
                size={20}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isDark ? '#000000' : '#FFFFFF',
                  marginLeft: 8,
                }}
              >
                Available Balance
              </Text>
            </View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: isDark ? '#000000' : '#FFFFFF',
                marginBottom: 4,
              }}
            >
              ₦{walletData?.balance?.toLocaleString() || '0'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#333333' : '#E8E8E8',
              }}
            >
              {walletData?.currency || 'NGN'}
            </Text>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={isDark ? '#000000' : '#FFFFFF'}
                />
                <Text
                  style={{
                    fontWeight: '600',
                    color: isDark ? '#000000' : '#FFFFFF',
                  }}
                >
                  Add Money
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.card,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="bank-transfer"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Withdraw
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="trending-up"
                  size={16}
                  color="#10B981"
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginLeft: 6,
                    fontWeight: '600',
                  }}
                >
                  Credits
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#10B981',
                }}
              >
                ₦{stats.totalCredit.toLocaleString()}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="trending-down"
                  size={16}
                  color="#EF4444"
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginLeft: 6,
                    fontWeight: '600',
                  }}
                >
                  Debits
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#EF4444',
                }}
              >
                ₦{stats.totalDebit.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Recent Transactions
          </Text>

          {transactions.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 32,
              }}
            >
              <MaterialCommunityIcons
                name="history"
                size={40}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: 12,
                }}
              >
                No transactions yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {transactions.map((transaction) => (
                <View
                  key={transaction.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor:
                        getTransactionColor(transaction.transaction_type) + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={getTransactionIcon(transaction.transaction_type)}
                      size={20}
                      color={getTransactionColor(transaction.transaction_type)}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: 3,
                      }}
                    >
                      {transaction.source === 'ride'
                        ? 'Ride Payment'
                        : transaction.source === 'deposit'
                        ? 'Wallet Top-up'
                        : transaction.source === 'payout'
                        ? 'Withdrawal'
                        : transaction.source}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                      }}
                    >
                      {formatDate(transaction.created_at)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: getTransactionColor(transaction.transaction_type),
                        marginBottom: 3,
                      }}
                    >
                      {transaction.transaction_type === 'debit' ||
                      transaction.transaction_type === 'payout'
                        ? '-'
                        : '+'}
                      ₦{transaction.amount.toLocaleString()}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 3,
                        backgroundColor:
                          transaction.status === 'completed'
                            ? '#10B98120'
                            : '#CCCCCC20',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '600',
                          color:
                            transaction.status === 'completed'
                              ? '#10B981'
                              : colors.textSecondary,
                          textTransform: 'capitalize',
                        }}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <RiderBottomNavigation />
    </SafeAreaView>
  );
}
//       amount: -3500,
//       timestamp: '2024-01-14 19:45',
//       icon: '🚗',
//       rideId: 'ride-2',
//     },
//     {
//       id: '4',
//       type: 'bonus',
//       description: 'Referral Bonus',
//       amount: 500,
//       timestamp: '2024-01-14 12:00',
//       icon: '🎁',
//     },
//     {
//       id: '5',
//       type: 'ride_payment',
//       description: 'Ride to Yaba',
//       amount: -2800,
//       timestamp: '2024-01-13 11:20',
//       icon: '🚗',
//       rideId: 'ride-3',
//     },
//   ];

//   const renderTransactionCard = ({ item }: { item: (typeof transactions)[0] }) => (
//     <Card isDark={isDark}>
//       <TouchableOpacity
//         onPress={() => {
//           if (item.rideId) {
//             router.push({
//               pathname: '/rider/ride-details',
//               params: { rideId: item.rideId },
//             });
//           }
//         }}
//       >
//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}
//         >
//           <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
//             <View
//               style={{
//                 width: 44,
//                 height: 44,
//                 borderRadius: 22,
//                 backgroundColor: colors.background,
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 marginRight: 12,
//               }}
//             >
//               <Text style={{ fontSize: 20 }}>{item.icon}</Text>
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
//                 {item.description}
//               </Text>
//               <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
//                 {item.timestamp}
//               </Text>
//             </View>
//           </View>
//           <Text
//             style={{
//               fontSize: 14,
//               fontWeight: 'bold',
//               color: item.amount > 0 ? colors.success : colors.text,
//             }}
//           >
//             {item.amount > 0 ? '+' : ''}₦{Math.abs(item.amount)}
//           </Text>
//         </View>
//       </TouchableOpacity>
//     </Card>
//   );

//   const topupAmounts = [1000, 5000, 10000, 20000, 50000];

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
//       <FlatList
//         ListHeaderComponent={
//           <>
//             {/* Header */}
//             <View
//               style={{
//                 paddingHorizontal: 20,
//                 paddingVertical: 16,
//                 borderBottomWidth: 1,
//                 borderBottomColor: colors.border,
//               }}
//             >
//               <TouchableOpacity onPress={() => router.back()}>
//                 <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
//               </TouchableOpacity>
//               <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 12 }}>
//                 Wallet
//               </Text>
//             </View>

//             {/* Balance Card */}
//             <View
//               style={{
//                 marginHorizontal: 20,
//                 marginTop: 20,
//                 paddingHorizontal: 20,
//                 paddingVertical: 24,
//                 borderRadius: 12,
//                 backgroundColor: colors.primary,
//                 alignItems: 'center',
//               }}
//             >
//               <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
//                 Available Balance
//               </Text>
//               <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 }}>
//                 ₦{walletBalance}
//               </Text>
//               <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
//                 <View style={{ flex: 1 }}>
//                   <Button
//                     title="Top-up"
//                     onPress={() => setShowTopupModal(true)}
//                     isDark={false}
//                     size="small"
//                   />
//                 </View>
//                 <TouchableOpacity
//                   style={{
//                     flex: 1,
//                     paddingVertical: 10,
//                     borderRadius: 8,
//                     backgroundColor: 'rgba(255,255,255,0.2)',
//                     borderWidth: 1,
//                     borderColor: '#FFFFFF',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Text
//                     style={{
//                       textAlign: 'center',
//                       fontWeight: '600',
//                       color: '#FFFFFF',
//                       fontSize: 13,
//                     }}
//                   >
//                     Withdraw
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Stats */}
//             <View
//               style={{
//                 marginHorizontal: 20,
//                 marginTop: 20,
//                 marginBottom: 20,
//                 flexDirection: 'row',
//                 gap: 12,
//               }}
//             >
//               <Card isDark={isDark}>
//                 <View style={{ alignItems: 'center' }}>
//                   <Text style={{ fontSize: 24, marginBottom: 4 }}>💰</Text>
//                   <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
//                     This Month
//                   </Text>
//                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
//                     ₦{45000}
//                   </Text>
//                 </View>
//               </Card>
//               <Card isDark={isDark}>
//                 <View style={{ alignItems: 'center' }}>
//                   <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
//                   <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
//                     All Time
//                   </Text>
//                   <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
//                     ₦{150000}
//                   </Text>
//                 </View>
//               </Card>
//             </View>

//             {/* Transactions Header */}
//             <View
//               style={{
//                 paddingHorizontal: 20,
//                 marginBottom: 12,
//               }}
//             >
//               <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
//                 Recent Transactions
//               </Text>
//             </View>
//           </>
//         }
//         data={transactions}
//         renderItem={renderTransactionCard}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
//         scrollEnabled={true}
//       />

//       {/* Top-up Modal */}
//       {showTopupModal && (
//         <View
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: 'rgba(0,0,0,0.5)',
//             justifyContent: 'flex-end',
//             zIndex: 1000,
//             paddingHorizontal: 20,
//             paddingBottom: 20,
//           }}
//         >
//           <Card isDark={isDark}>
//             <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
//               Add Funds
//             </Text>

//             <View style={{ marginBottom: 16 }}>
//               <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
//                 Quick Amount
//               </Text>
//               <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
//                 {topupAmounts.map((amount) => (
//                   <TouchableOpacity
//                     key={amount}
//                     onPress={() => setTopupAmount(amount.toString())}
//                     style={{
//                       flex: 1,
//                       minWidth: '30%',
//                       paddingVertical: 10,
//                       borderRadius: 6,
//                       borderWidth: 1,
//                       borderColor:
//                         topupAmount === amount.toString() ? colors.primary : colors.border,
//                       backgroundColor:
//                         topupAmount === amount.toString()
//                           ? colors.primary + '15'
//                           : 'transparent',
//                     }}
//                   >
//                     <Text
//                       style={{
//                         textAlign: 'center',
//                         fontWeight: '600',
//                         color:
//                           topupAmount === amount.toString()
//                             ? colors.primary
//                             : colors.text,
//                         fontSize: 12,
//                       }}
//                     >
//                       ₦{amount}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>

//             <View style={{ flexDirection: 'row', gap: 12 }}>
//               <TouchableOpacity
//                 onPress={() => setShowTopupModal(false)}
//                 style={{
//                   flex: 1,
//                   paddingVertical: 12,
//                   borderRadius: 8,
//                   borderWidth: 1,
//                   borderColor: colors.border,
//                 }}
//               >
//                 <Text
//                   style={{
//                     textAlign: 'center',
//                     fontWeight: '600',
//                     color: colors.text,
//                   }}
//                 >
//                   Cancel
//                 </Text>
//               </TouchableOpacity>
//               <View style={{ flex: 1 }}>
//                 <Button
//                   title="Continue"
//                   onPress={() => {
//                     setShowTopupModal(false);
//                     // Navigate to payment screen
//                   }}
//                   isDark={isDark}
//                 />
//               </View>
//             </View>
//           </Card>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }
