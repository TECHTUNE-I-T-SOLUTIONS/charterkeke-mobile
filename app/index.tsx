import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, userRole } = useAuth();

  useEffect(() => {
    const checkFirstTime = async () => {
      if (!isLoading) {
        if (!isAuthenticated) {
          // Not authenticated - show login
          router.replace('/auth/welcome');
        } else {
          // Authenticated - route based on user role
          if (userRole === 'driver') {
            console.log('✅ [ROUTING] User is driver, routing to /driver/home');
            router.replace('/driver/home');
          } else if (userRole === 'rider') {
            console.log('✅ [ROUTING] User is rider, routing to /rider/home');
            router.replace('/rider/home');
          } else {
            console.warn('⚠️  [ROUTING] Unknown user role:', userRole, 'defaulting to rider');
            router.replace('/rider/home');
          }
        }
      }
    };

    checkFirstTime();
  }, [isLoading, isAuthenticated, userRole]);

  // Return null while redirecting
  return null;
}
