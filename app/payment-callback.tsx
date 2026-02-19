import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const { reference } = useLocalSearchParams<{ reference?: string }>();
  const [status, setStatus] = React.useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = React.useState('Verifying payment...');

  useEffect(() => {
    verifyPayment();
  }, [reference]);

  const verifyPayment = async () => {
    try {
      if (!reference) {
        setStatus('failed');
        setMessage('No payment reference found');
        setTimeout(() => router.push('/driver/wallet'), 3000);
        return;
      }

      console.log('🔗 [DEEPLINK] Payment callback received with reference:', reference);

      // Verify payment with backend
      const result = await apiService.verifyDriverSettlementPayment(reference as string);

      if (result?.paymentStatus === 'success') {
        console.log('✅ [DEEPLINK] Payment verified successfully');
        setStatus('success');
        setMessage('✅ Payment Successful!\nYour settlement has been paid.\nRedirecting to wallet...');
        
        // Clear pending reference from cache
        await cacheService.remove('paystack_pending_reference');
        
        // Redirect to wallet after 2 seconds
        setTimeout(() => {
          router.push('/driver/wallet');
        }, 2000);
      } else if (['failed', 'cancelled'].includes(result?.paymentStatus)) {
        console.log('❌ [DEEPLINK] Payment failed:', result?.paymentStatus);
        setStatus('failed');
        setMessage(`Payment ${result?.paymentStatus}.\nRedirecting to wallet...`);
        setTimeout(() => router.push('/driver/wallet'), 3000);
      } else {
        console.log('⏳ [DEEPLINK] Payment pending:', result?.paymentStatus);
        setStatus('verifying');
        setMessage(`Payment status: ${result?.paymentStatus}\nRedirecting to wallet...`);
        setTimeout(() => router.push('/driver/wallet'), 2000);
      }
    } catch (error) {
      console.error('💥 [DEEPLINK] Payment verification error:', error);
      setStatus('failed');
      setMessage('Unable to verify payment.\nRedirecting to wallet...');
      setTimeout(() => router.push('/driver/wallet'), 3000);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        {status === 'verifying' && (
          <>
            <ActivityIndicator size="large" color="#D67E0B" />
            <Text style={{ color: '#fff', marginTop: 20, fontSize: 16, textAlign: 'center' }}>
              {message}
            </Text>
          </>
        )}
        {status === 'success' && (
          <Text style={{ color: '#10B981', fontSize: 18, textAlign: 'center', fontWeight: 'bold' }}>
            {message}
          </Text>
        )}
        {status === 'failed' && (
          <Text style={{ color: '#FF6B6B', fontSize: 18, textAlign: 'center', fontWeight: 'bold' }}>
            {message}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
