import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, userRole } = useAuth();

  useEffect(() => {
    const checkFirstTime = async () => {
      // Always clear sessionResumed on app startup - forces re-verification for security
      // Each time the app is closed and reopened, the user must verify their identity
      await AsyncStorage.removeItem('sessionResumed');
      
      if (!isLoading) {
        if (!isAuthenticated) {
          // Not authenticated - show login
          console.log('🔐 [ROUTING] User not authenticated, routing to welcome');
          router.replace('/auth/welcome');
        } else {
          // Authenticated but session closed - user needs to verify identity
          const userEmail = user && 'email' in user ? user.email : '';
          console.log('🔐 [ROUTING] Session needs verification, routing to resume-session');
          router.replace({
            pathname: '/auth/resume-session',
            params: { email: userEmail },
          });
        }
      }
    };

    checkFirstTime();
  }, [isLoading, isAuthenticated]);

  // Return null while redirecting
  return null;
}
