import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, userRole } = useAuth();

  useEffect(() => {
    const checkFirstTime = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        console.log('[ROUTING] User not authenticated, routing to welcome');
        router.replace('/auth/welcome');
        return;
      }

      const [sessionResumed, sessionResumedDate] = await Promise.all([
        AsyncStorage.getItem('sessionResumed'),
        AsyncStorage.getItem('sessionResumedDate'),
      ]);
      if (sessionResumed === 'true' && sessionResumedDate === localDayKey()) {
        const role = userRole || ((user as any)?.role as string | undefined);
        router.replace(role === 'driver' ? '/driver/home' : '/rider/home');
        return;
      }

      const userEmail = user && 'email' in user ? user.email : '';
      console.log('[ROUTING] Session needs verification, routing to resume-session');
      router.replace({
        pathname: '/auth/resume-session',
        params: { email: userEmail },
      });
    };

    checkFirstTime();
  }, [isLoading, isAuthenticated, router, user, userRole]);

  return null;
}
