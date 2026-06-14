import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { apiService } from '@/services/api';
import { normalizeNotificationPayload, resolveNotificationRoute } from '@/services/notificationService';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';
import { useNotifications } from '@/hooks/useLocationCache';

interface Notification {
  id: string;
  title?: string;
  message: string;
  type?: string;
  is_read?: boolean | null;
  read?: boolean | null;
  created_at: string;
  action_url?: string;
  deep_link?: string;
  metadata?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  // Use React Query caching hook for notifications (auto-refreshes every 30s)
  const { 
    data: notificationsData = [] as Notification[], 
    isLoading: loading, 
    isFetching: refreshing, 
    error,
    refetch 
  } = useNotifications();

  const isDark = theme?.mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  // Use notifications data directly from React Query - no need to sync to local state
  // React Query already handles caching and memoization
  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  const onRefresh = async () => {
    await refetch();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      console.log('📝 [NOTIFICATIONS] Marking notification as read:', notificationId);
      
      await apiService.patch('/user/notifications', { notificationId });
      
      console.log('✅ [NOTIFICATIONS] Notification marked as read');
      // Refetch to sync with server state
      await refetch();
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to mark as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!(notification.is_read || notification.read)) {
      await handleMarkAsRead(notification.id);
    }
    const payload = normalizeNotificationPayload(notification);
    const route = resolveNotificationRoute(payload, 'rider');
    if (route) {
      router.push(route as any);
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'ride':
        return 'car';
      case 'payment':
        return 'credit-card';
      case 'warning':
        return 'alert-circle';
      case 'info':
        return 'information';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'success':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !(n.is_read || n.read)).length 
    : 0;

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ListScreenSkeleton itemCount={5} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <MaterialCommunityIcons name="lock" size={48} color={colors.textSecondary} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 }}>
            Not Authenticated
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Please log in to view your notifications.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ListScreenSkeleton itemCount={5} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 }}>
            Error Loading Notifications
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            {error instanceof Error ? error.message : 'Failed to load notifications'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
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
          colors={[
            isDark ? '#000000B2' : '#E4D1B9',
            isDark ? '#3F2401' : '#C49961D0',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
        >
          {/* <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View> */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'static' }}>
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#000000',
                }}
              >
                Notifications
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? '#FFFFFF' : '#000000',
                  fontWeight: '500',
                  marginTop: 4,
                }}
              >
              {notifications.length} total {unreadCount > 0 ? `(${unreadCount} new)` : ''}
              </Text>
            </View>
            {unreadCount > 0 && (
              <View
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  {unreadCount}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Notifications List */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {notifications.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}
            >
              <MaterialCommunityIcons
                name="bell-off"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: 16,
                }}
              >
                No notifications yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                You'll receive notifications about your rides and account activity here
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12, marginBottom: 20 }}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  activeOpacity={0.75}
                  onPress={() => handleNotificationPress(notification)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: (notification.is_read || notification.read) ? colors.card : `${colors.primary}15`,
                    borderWidth: 1,
                    borderColor: (notification.is_read || notification.read) ? colors.border : colors.primary,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    {/* Icon */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: `${getNotificationColor(notification.type)}20`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 2,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: colors.text,
                            flex: 1,
                          }}
                        >
                          {notification.title}
                        </Text>
                        {!notification.is_read && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.primary,
                            }}
                          />
                        )}
                      </View>

                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginBottom: 8,
                          lineHeight: 18,
                        }}
                      >
                        {notification.message}
                      </Text>

                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatDate(notification.created_at)}
                      </Text>
                    </View>

                    {/* Actions */}
                    {!notification.is_read && (
                      <TouchableOpacity
                        onPress={() => handleMarkAsRead(notification.id)}
                        disabled={markingAsRead === notification.id}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          backgroundColor: colors.primary + '20',
                          opacity: markingAsRead === notification.id ? 0.6 : 1,
                        }}
                      >
                        {markingAsRead === notification.id ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
