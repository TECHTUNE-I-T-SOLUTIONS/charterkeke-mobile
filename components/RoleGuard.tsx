import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, redirectTo, children }: RoleGuardProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!user || !userRole) {
      router.replace('/(auth)/login');
      return;
    }

    // If user's role is not in allowed roles, redirect to appropriate screen
    if (!allowedRoles.includes(userRole)) {
      const redirectPath = redirectTo || (userRole === 'driver' ? '/driver/dashboard' : '/rider/booking');
      // console.log(`[RoleGuard] User role ${userRole} not allowed. Redirecting to ${redirectPath}`);
      router.replace(redirectPath);
    }
  }, [user, userRole, isLoading, allowedRoles, redirectTo, router]);

  // Don't render children if loading or role doesn't match
  if (isLoading) return null;
  if (!user || !userRole) return null;
  if (!allowedRoles.includes(userRole)) return null;

  return <>{children}</>;
}
