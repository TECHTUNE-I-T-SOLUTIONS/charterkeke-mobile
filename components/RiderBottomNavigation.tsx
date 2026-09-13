import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { apiService } from '@/services/api';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavItem {
  name: string;
  icon: string;
  iconFamily?: 'material' | 'community';
  route: string;
  label: string;
}

const RIDER_NAV_ITEMS: NavItem[] = [
  // Home menu removed for simplified rider experience
  // { name: 'home', icon: 'home', route: '/rider/home', label: 'Home' },
  { name: 'booking', icon: 'location-on', route: '/rider/booking', label: 'Book' },
  { name: 'rides', icon: 'history', route: '/rider/rides-history', label: 'Rides' },
  // Removed notifications/alerts menu for cleaner UI
  { name: 'notifications', icon: 'notifications', route: '/rider/notifications', label: 'Alerts' },
  // Replaced referrals with cashback with valid icon
  { name: 'cashback', icon: 'gift', iconFamily: 'community', route: '/rider/cashback', label: 'Cashback' },
  { name: 'profile', icon: 'person', route: '/rider/profile', label: 'Profile' },
];

const SPRING = { damping: 20, stiffness: 220, mass: 0.7 } as const;

function TabButton({
  item,
  focused,
  onPress,
}: {
  item: NavItem;
  focused: boolean;
  onPress: () => void;
}) {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  // Animating the label's width/opacity is what makes the pill feel like it
  // grows rather than snapping between two layouts.
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, SPRING), [focused]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxWidth: progress.value * 90,
    marginLeft: progress.value * 6,
  }));

  const iconColor = focused ? '#FFFFFF' : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      onPress={onPress}
      style={[styles.item, focused && { backgroundColor: colors.primary }]}
    >
      {item.iconFamily === 'community' ? (
        <MaterialCommunityIcons
          name={item.icon as any}
          size={20}
          color={iconColor}
        />
      ) : (
        <MaterialIcons
          name={item.icon as any}
          size={20}
          color={iconColor}
        />
      )}
      <Animated.Text
        numberOfLines={1}
        style={[styles.itemLabel, labelStyle, { color: '#FFFFFF' }]}
      >
        {item.label}
      </Animated.Text>
    </Pressable>
  );
}

export default function RiderBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();
  const isDriverArea = pathname.includes('/driver');
  const [availableRideCount, setAvailableRideCount] = useState(0);
  const [newRideCount, setNewRideCount] = useState(0);

  const getNavItems = () => {
    if (isDriverArea) {
      return DRIVER_NAV_ITEMS;
    }
    return RIDER_NAV_ITEMS;
  };

  const navItems = getNavItems();
  const isActive = (route: string) => pathname === route;

  const handleNavigation = (route: string) => {
    // Only navigate if not already on that route
    if (!isActive(route)) {
      Haptics.selectionAsync().catch(() => {});
      router.replace(route); // Use replace() instead of push() to avoid stacking
    }
  };

  useEffect(() => {
    if (!isDriverArea) return;

    let mounted = true;
    const seenKey = 'driver_rides_seen_available_count';

    const refreshRideBadge = async () => {
      try {
        const statusResponse = (await apiService.get('/driver/status')) as any;
        const driverStatus = String(statusResponse?.status || statusResponse?.driver?.availability_status || '').toLowerCase();
        if (driverStatus !== 'online') {
          if (mounted) {
            setAvailableRideCount(0);
            setNewRideCount(0);
          }
          return;
        }

        const response = (await apiService.get('/driver/available-rides?radiusKm=10').catch(() => ({ rides: [] }))) as any;
        const count = Array.isArray(response?.rides) ? response.rides.length : 0;
        const rawSeen = await AsyncStorage.getItem(seenKey);
        const seenCount = Number(rawSeen || 0);
        const driverIsViewingRides = pathname.includes('/driver/rides') || pathname.includes('/driver/available-rides');

        if (driverIsViewingRides) {
          await AsyncStorage.setItem(seenKey, String(count));
        }

        if (mounted) {
          setAvailableRideCount(count);
          setNewRideCount(driverIsViewingRides ? 0 : Math.max(0, count - seenCount));
        }
      } catch {
        if (mounted) {
          setAvailableRideCount(0);
          setNewRideCount(0);
        }
      }
    };

    refreshRideBadge();
    const interval = setInterval(refreshRideBadge, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isDriverArea, pathname]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.barWrap, { bottom: insets.bottom > 0 ? insets.bottom : 16 }]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: colors.border,
          },
        ]}
      >
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <TabButton
              key={item.name}
              item={item}
              focused={active}
              onPress={() => handleNavigation(item.route)}
            />
          );
        })}
      </View>
    </View>
  );
}

const DRIVER_NAV_ITEMS: NavItem[] = [
  { name: 'home', icon: 'home', route: '/driver/home', label: 'Home' },
  { name: 'rides', icon: 'rickshaw', iconFamily: 'community', route: '/driver/rides', label: 'Rides' },
  { name: 'earnings', icon: 'trending-up', route: '/driver/earnings', label: 'Earnings' },
  { name: 'wallet', icon: 'wallet', route: '/driver/wallet', label: 'Wallet' },
  { name: 'profile', icon: 'person', route: '/driver/profile', label: 'Profile' },
];

const styles = StyleSheet.create({
  barWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    marginHorizontal: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  itemLabel: { fontSize: 13, fontWeight: '800', overflow: 'hidden' },
});
