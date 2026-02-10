// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { apiService } from '@services/api';
import RiderBottomNavigation from '@components/RiderBottomNavigation';
import { COLORS } from '@utils/colors';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('📬 [NOTIFICATIONS] Fetching notifications...');
      
      const response = await apiService.get('/driver/notifications');
      console.log('✅ [NOTIFICATIONS] Fetched:', response);
      
      const data = (response as any)?.notifications || response || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error fetching:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await apiService.put(`/driver/notifications/${notification.id}`, { markAsRead: true });
        
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notification.id 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        ));
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'ride':
        return 'car';
      case 'payment':
        return 'wallet';
      case 'document':
        return 'file-document';
      case 'alert':
        return 'alert-circle';
      case 'promotion':
        return 'gift';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'ride':
        return '#3b82f6';
      case 'payment':
        return '#10b981';
      case 'document':
        return '#f59e0b';
      case 'alert':
        return '#ef4444';
      case 'promotion':
        return '#8b5cf6';
      default:
        return colors.primary;
    }
  };

  const renderNotificationItem = ({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleMarkAsRead(notification)}
      style={{
        marginBottom: scale(8),
        marginHorizontal: scale(16),
        paddingHorizontal: scale(12),
        paddingVertical: scale(12),
        backgroundColor: notification.read ? 'transparent' : colors.primary + '15',
        borderLeftWidth: 4,
        borderLeftColor: notification.read ? colors.border : colors.primary,
        borderRadius: scale(8),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: scale(12) }}>
        <View style={{
          width: scale(40),
          height: scale(40),
          borderRadius: scale(8),
          backgroundColor: getNotificationColor(notification.type) + '20',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <MaterialCommunityIcons
            name={getNotificationIcon(notification.type) as any}
            size={scale(20)}
            color={getNotificationColor(notification.type)}
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(4) }}>
            <Text style={{ fontSize: scale(13), fontWeight: '600', color: colors.foreground, flex: 1 }}>
              {notification.title}
            </Text>
            {!notification.read && (
              <View style={{
                width: scale(8),
                height: scale(8),
                borderRadius: scale(4),
                backgroundColor: colors.primary,
              }} />
            )}
          </View>
          
          <Text style={{ fontSize: scale(12), color: colors.mutedForeground, marginBottom: scale(6), lineHeight: scale(16) }}>
            {notification.message}
          </Text>
          
          <Text style={{ fontSize: scale(11), color: colors.mutedForeground }}>
            {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const emptyState = (
    <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: scale(60) }}>
      <MaterialCommunityIcons name="bell-off" size={48} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontSize: scale(14), marginTop: scale(12), textAlign: 'center' }}>
        No notifications yet
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: scale(16),
          paddingVertical: scale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={scale(24)} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: scale(20), fontWeight: 'bold', color: colors.foreground }}>
            Notifications
          </Text>
          <View style={{ width: scale(24) }} />
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingVertical: scale(8),
            paddingBottom: scale(100),
            flexGrow: 1,
          }}
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      </SafeAreaView>

      {/* Bottom Navigation */}
      <RiderBottomNavigation />
    </View>
  );
}
