import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { PaymentMethodsSkeleton } from '@/components/PaymentMethodsSkeleton';

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

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const screenLaunchedOnce = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!screenLaunchedOnce.current) {
        screenLaunchedOnce.current = true;
        fetchPaymentMethods();
      }
    }, [])
  );

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      console.log('📤 [PAYMENT-METHODS] Fetching payment methods...');
      // In production, fetch from /user/payment-methods or similar endpoint
      // For now, initializing with sample data
      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          name: 'Visa',
          last4: '4242',
          expiryDate: '12/26',
          isDefault: true,
        },
        {
          id: '2',
          type: 'wallet',
          name: 'Charter Keke Wallet',
          last4: '',
          isDefault: false,
        },
      ]);
    } catch (error) {
      console.error('❌ [PAYMENT-METHODS] Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    }));
    setPaymentMethods(updated);
    
    // In production, call API to save default payment method
    console.log('📤 [PAYMENT-METHODS] Setting default payment method:', id);
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: () => {
            const updated = paymentMethods.filter(method => method.id !== id);
            setPaymentMethods(updated);
            
            // In production, call API to delete payment method
            console.log('📤 [PAYMENT-METHODS] Deleting payment method:', id);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return 'credit-card';
      case 'wallet':
        return 'wallet';
      case 'bank':
        return 'bank';
      default:
        return 'payment';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Methods</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {loading ? (
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
        )}

        {/* Add Payment Reminder */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.primary + '10', borderColor: colors.primary }
          ]}
        >
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Secure Payments</Text>
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
