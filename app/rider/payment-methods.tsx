import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { COLORS } from '@/utils/colors';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  details: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'bank' | 'wallet'>('card');

  const colors = isDark ? COLORS.dark : COLORS.light;

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'wallet',
      name: 'Charter Keke Wallet',
      details: 'Balance: ₦15,000',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      name: 'Visa Card',
      details: '•••• •••• •••• 4242',
      isDefault: false,
    },
    {
      id: '3',
      type: 'bank',
      name: 'First Bank',
      details: 'Account ending in 4567',
      isDefault: false,
    },
  ]);

  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleDeleteMethod = (id: string) => {
    setPaymentMethods(
      paymentMethods.filter((method) => method.id !== id)
    );
  };

  const handleAddPaymentMethod = () => {
    // In a real app, this would validate and process the payment method
    if (paymentType === 'card' && !formData.cardNumber) {
      alert('Please enter card number');
      return;
    }
    if (paymentType === 'bank' && !formData.accountNumber) {
      alert('Please enter account number');
      return;
    }

    // Add new payment method
    setShowAddModal(false);
    setFormData({
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
    });
    alert('Payment method added successfully!');
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return '💳';
      case 'bank':
        return '🏦';
      case 'wallet':
        return '💰';
      default:
        return '💰';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
            Payment Methods
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info Card */}
        <Card isDark={isDark}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            Manage your payment methods for faster and easier transactions. You can add credit cards, debit cards, and bank accounts.
          </Text>
        </Card>

        {/* Payment Methods List */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {paymentMethods.map((method) => (
            <Card key={method.id} isDark={isDark}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {getPaymentIcon(method.type)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: 2,
                      }}
                    >
                      {method.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                      }}
                    >
                      {method.details}
                    </Text>
                  </View>
                </View>

                {method.isDefault && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: colors.success + '20',
                      borderRadius: 4,
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: colors.success,
                      }}
                    >
                      Default
                    </Text>
                  </View>
                )}
              </View>

              {!method.isDefault && (
                <TouchableOpacity
                  onPress={() => handleSetDefault(method.id)}
                  style={{
                    paddingVertical: 8,
                    marginBottom: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.primary,
                      fontWeight: '600',
                    }}
                  >
                    Set as Default
                  </Text>
                </TouchableOpacity>
              )}

              {method.type !== 'wallet' && (
                <TouchableOpacity
                  onPress={() => handleDeleteMethod(method.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.error }}>
                    🗑️ Remove
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          ))}
        </View>

        {/* Add Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Button
            title="+ Add Payment Method"
            onPress={() => setShowAddModal(true)}
            isDark={isDark}
          />
        </View>

        {/* Security Info */}
        <Card isDark={isDark}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            }}
          >
            🔒 Your Payment Information
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              lineHeight: 18,
            }}
          >
            All payment information is encrypted and stored securely. We never store your full card details on our servers.
          </Text>
        </Card>
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{
            flex: 1,
            backgroundColor: '#00000060',
            justifyContent: 'flex-end',
          }}
        >
          <RNSafeAreaView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Add Payment Method
            </Text>

            {/* Payment Type Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 8,
                  fontWeight: '500',
                }}
              >
                Payment Type
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {[
                  { type: 'card', label: 'Card' },
                  { type: 'bank', label: 'Bank' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    onPress={() => setPaymentType(option.type as 'card' | 'bank')}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor:
                        paymentType === option.type
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        paymentType === option.type
                          ? colors.primary + '15'
                          : colors.background,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color:
                          paymentType === option.type
                            ? colors.primary
                            : colors.textSecondary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card Fields */}
            {paymentType === 'card' && (
              <>
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: '500',
                    }}
                  >
                    Card Name
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }}
                    placeholder="E.g., My Visa Card"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.cardName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, cardName: text })
                    }
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: '500',
                    }}
                  >
                    Card Number
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.cardNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, cardNumber: text })
                    }
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 6,
                        fontWeight: '500',
                      }}
                    >
                      Expiry Date
                    </Text>
                    <TextInput
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: colors.text,
                        backgroundColor: colors.background,
                      }}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textSecondary}
                      value={formData.expiryDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, expiryDate: text })
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 6,
                        fontWeight: '500',
                      }}
                    >
                      CVV
                    </Text>
                    <TextInput
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        fontSize: 14,
                        color: colors.text,
                        backgroundColor: colors.background,
                      }}
                      placeholder="123"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={4}
                      value={formData.cvv}
                      onChangeText={(text) =>
                        setFormData({ ...formData, cvv: text })
                      }
                    />
                  </View>
                </View>
              </>
            )}

            {/* Bank Fields */}
            {paymentType === 'bank' && (
              <>
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: '500',
                    }}
                  >
                    Bank Name
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }}
                    placeholder="E.g., First Bank, GT Bank"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.bankName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, bankName: text })
                    }
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: '500',
                    }}
                  >
                    Account Number
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }}
                    placeholder="0123456789"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.accountNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, accountNumber: text })
                    }
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 6,
                      fontWeight: '500',
                    }}
                  >
                    Account Name
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }}
                    placeholder="Your name as it appears in the bank"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.accountName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, accountName: text })
                    }
                  />
                </View>
              </>
            )}

            {/* Buttons */}
            <View style={{ gap: 8 }}>
              <Button
                title="Add Payment Method"
                onPress={handleAddPaymentMethod}
                isDark={isDark}
              />
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </RNSafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
