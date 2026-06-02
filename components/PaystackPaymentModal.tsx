import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

WebBrowser.maybeCompleteAuthSession();

interface PaystackPaymentModalProps {
  visible: boolean;
  authUrl: string;
  reference: string;
  amount: number;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export const PaystackPaymentModal: React.FC<PaystackPaymentModalProps> = ({
  visible,
  authUrl,
  reference,
  amount,
  onSuccess,
  onError,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const handleOpenPayment = async () => {
    try {
      setLoading(true);
      console.log('🔗 [PAYSTACK_BROWSER] Opening payment URL:', authUrl);

      const returnUrl = Linking.createURL('payment-callback');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
      
      console.log('🔄 [PAYSTACK_BROWSER] Browser result:', result);

      if (result.type === 'success') {
        console.log('✅ [PAYSTACK_BROWSER] Redirected back to app, verifying payment...');
        const callbackUrl = result.url ? Linking.parse(result.url) : null;
        const callbackReference =
          callbackUrl?.queryParams?.reference?.toString() ||
          callbackUrl?.path?.split('/').filter(Boolean).pop() ||
          reference;
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        onSuccess(callbackReference);
        return;
      }

      if (result.type === 'dismiss') {
        console.log('⏳ [PAYSTACK_BROWSER] Session dismissed, attempting verification...');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1200));
        onSuccess(reference);
        return;
      }

      if (result.type === 'cancel') {
        onError('Payment was cancelled before completion');
      }
    } catch (error: any) {
      console.error('🔴 [PAYSTACK_BROWSER] Error:', error);
      onError(error?.message || 'Failed to open payment gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Close Payment',
      'Are you sure you want to close this payment? Make sure you have completed the payment.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Close',
          onPress: () => onClose(),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Secure Payment</Text>
            <Text style={styles.headerSubtitle}>₦{amount.toLocaleString('en-US')}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Payment Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="shield-check" size={48} color={BRAND.primary} />
            <Text style={styles.infoTitle}>Secure Payment Gateway</Text>
            <Text style={styles.infoSubtitle}>Powered by Paystack</Text>
            <Text style={styles.infoText}>
              Your payment information is secure and encrypted.{'\n'}
              Tap the button below to proceed to payment.
            </Text>
          </View>

          {/* Amount Display */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Settlement Amount</Text>
            <Text style={styles.amountValue}>₦{amount.toLocaleString('en-US')}</Text>
            <Text style={styles.referenceLabel}>Reference: {reference}</Text>
          </View>

          {/* Payment Button */}
          <TouchableOpacity
            onPress={handleOpenPayment}
            disabled={loading}
            style={[styles.payButton, loading && styles.payButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="credit-card" size={20} color="#000" />
                <Text style={styles.payButtonText}>Open Payment Gateway</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.disclaimerBox}>
            <MaterialCommunityIcons name="information" size={16} color="#999" />
            <Text style={styles.disclaimerText}>
              You will be taken to Paystack's secure checkout. After completing payment, return to this app.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: BRAND.primary,
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  infoContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  infoBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  infoSubtitle: {
    color: BRAND.primary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  infoText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  amountBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.primary,
  },
  amountLabel: {
    color: '#999',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  amountValue: {
    color: BRAND.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  referenceLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 12,
    fontFamily: 'monospace',
  },
  payButton: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimerBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  disclaimerText: {
    color: '#999',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});
