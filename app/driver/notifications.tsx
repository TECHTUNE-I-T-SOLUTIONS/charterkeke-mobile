// 'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cache';
import { normalizeNotificationPayload, resolveNotificationRoute } from '@/services/notificationService';
import { COLORS, BRAND } from '@/utils/colors';
import { ListScreenSkeleton } from '@/components/ListScreenSkeleton';

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
  deep_link?: string;
  action_url?: string;
  metadata?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasCached, setHasCached] = useState(false);

  const isLight = mode === 'light';

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    const cached = await cacheService.get<Notification[]>('driver_notifications');
    if (cached) {
      setNotifications(cached);
      setHasCached(true);
      setLoading(false);
    }

    await fetchNotifications(!cached);
  };

  const fetchNotifications = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await apiService.get('/driver/notifications');
      const data = (response as any)?.notifications || response || [];
      const nextNotifications = Array.isArray(data) ? data : [];
      setNotifications(nextNotifications);
      await cacheService.set('driver_notifications', nextNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(!hasCached);
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await apiService.patch('/driver/notifications', { notificationId: notification.id, markAsRead: true });
        setNotifications((current) => current.map(n => 
          n.id === notification.id 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await handleMarkAsRead(notification);
    const payload = normalizeNotificationPayload(notification);
    const route = resolveNotificationRoute(payload, 'driver');
    if (route) {
      router.push(route as any);
    }
  };

  const getNotificationConfig = (type: string) => {
    const t = type?.toLowerCase();
    switch (t) {
      case 'ride': return { icon: 'car-sports', color: '#3B82F6' };
      case 'payment': return { icon: 'wallet', color: '#10B981' };
      case 'document': return { icon: 'file-document-outline', color: '#F59E0B' };
      case 'alert': return { icon: 'alert-circle-outline', color: '#EF4444' };
      case 'promotion': return { icon: 'gift-outline', color: '#8B5CF6' };
      default: return { icon: 'bell-outline', color: BRAND.primary };
    }
  };

  const renderNotificationItem = React.useCallback(({ item }: { item: Notification }) => {
    const config = getNotificationConfig(item.type);
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.itemContainer,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderLeftColor: item.read ? theme.colors.border : config.color,
            borderLeftWidth: 4,
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
          <MaterialCommunityIcons name={config.icon as any} size={22} color={config.color} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colors.textPrimary, fontWeight: item.read ? '600' : '700' }]}>
              {item.title}
            </Text>
            {!item.read && <View style={[styles.dot, { backgroundColor: config.color }]} />}
          </View>
          
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.message}
          </Text>
          
          <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [theme.colors.border, theme.colors.inputBackground, theme.colors.surface, theme.colors.textPrimary, theme.colors.textSecondary, theme.colors.textTertiary]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.inputBackground }]}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ListScreenSkeleton itemCount={5} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={80}
            windowSize={7}
            removeClippedSubviews
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.colors.inputBackground }]}>
                  <MaterialCommunityIcons name="bell-off-outline" size={40} color={theme.colors.textTertiary} />
                </View>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No notifications yet</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  message: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  time: { fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
