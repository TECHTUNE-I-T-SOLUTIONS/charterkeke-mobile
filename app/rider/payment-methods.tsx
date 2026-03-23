import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
// import { PaymentMethodsSkeleton } from '@/components/PaymentMethodsSkeleton';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank';
  name: string;
  last4: string;
  expiryDate?: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  // const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  // const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  // const screenLaunchedOnce = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      // if (!screenLaunchedOnce.current) {
      //   screenLaunchedOnce.current = true;
      //   fetchPaymentMethods();
      // }
    }, [])
  );

  // const fetchPaymentMethods = async () => {
  //   try {
  //     setLoading(true);
  //     console.log('📤 [PAYMENT-METHODS] we are not using payment methods...');
  //     // In production, fetch from /user/payment-methods or similar endpoint
  //     setPaymentMethods([]);
  //   } catch (error) {
  //     console.error('❌ [PAYMENT-METHODS] Error fetching:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Methods</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="cash" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* {loading ? (
          <PaymentMethodsSkeleton />
        ) : paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="credit-card" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No payment methods added
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add a payment method to book rides
            </Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <View
                key={method.id}
                style={[
                  styles.methodCard,
                  {
                    borderColor: method.isDefault ? colors.primary : colors.border,
                    backgroundColor: colors.card || colors.background,
                    borderWidth: method.isDefault ? 2 : 1,
                  }
                ]}
              >
                <View style={styles.methodHeader}>
                  <View style={styles.methodLeft}>
                    <View
                      style={[
                        styles.methodIconContainer,
                        { backgroundColor: colors.primary + '20' }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getPaymentIcon(method.type) as any}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={[styles.methodName, { color: colors.text }]}>
                        {method.name}
                      </Text>
                      {method.last4 && (
                        <Text style={[styles.methodDetails, { color: colors.textSecondary }]}>
                          ••••{method.last4}
                        </Text>
                      )}
                      {method.expiryDate && (
                        <Text style={[styles.methodDetails, { color: colors.textSecondary }]}>
                          Expires: {method.expiryDate}
                        </Text>
                      )}
                      {method.isDefault && (
                        <View
                          style={[
                            styles.defaultBadge,
                            { backgroundColor: colors.primary + '20' }
                          ]}
                        >
                          <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.methodActions, { borderTopColor: colors.border }]}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(method.id)}
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        Set as Default
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod(method.id)}
                    style={[styles.actionButton, { borderLeftColor: colors.border, borderLeftWidth: !method.isDefault ? 1 : 0 }]}
                  >
                    <MaterialCommunityIcons name="delete" size={16} color={colors.destructive} />
                    <Text style={[styles.deleteText, { color: colors.destructive }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )} */}

        {/* Payment Notification - Direct Cash Payment to Driver */}
        <View style={{ marginHorizontal: 16, marginTop: 24 }}>
          <View
            style={{
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary,
              borderWidth: 1.5,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="cash" size={28} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>Direct Payment to Driver</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Pay Cash at Destination</Text>
              </View>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
              You will pay your driver directly in <Text style={{ fontWeight: '600', color: colors.text }}>cash</Text> when the ride is complete at your destination.
            </Text>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 12, marginLeft: 8 }}>No platform fees</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 12, marginLeft: 8 }}>Driver gets full payment</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 12, marginLeft: 8 }}>Safe & transparent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.primary + '10', borderColor: colors.primary, marginTop: 16 }
          ]}
        >
          <MaterialCommunityIcons name="lock" size={20} color={colors.primary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Account Security</Text>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Payment Method</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderColor: colors.border, backgroundColor: colors.card || colors.background }
              ]}
            >
              <MaterialCommunityIcons name="credit-card" size={24} color={colors.primary} />
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Debit/Credit Card</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  Visa, Mastercard, etc.
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderColor: colors.border, backgroundColor: colors.card || colors.background }
              ]}
            >
              <MaterialCommunityIcons name="bank" size={24} color={colors.primary} />
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Bank Transfer</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  Direct bank account
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderColor: colors.border, backgroundColor: colors.card || colors.background }
              ]}
            >
              <MaterialCommunityIcons name="phone" size={24} color={colors.primary} />
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Mobile Wallet</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  PayStack, Stripe, etc.
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 8,
  },
  methodsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  methodCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 13,
    fontWeight: '600',
  },
  methodDetails: {
    fontSize: 11,
    marginTop: 2,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  methodActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 11,
    marginTop: 2,
  },
});
