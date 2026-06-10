import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { apiService } from '@/services/api';

interface NavItem {
  name: string;
  icon: string;
  iconFamily?: 'material' | 'community';
  route: string;
  label: string;
}

const RIDER_NAV_ITEMS: NavItem[] = [
  { name: 'home', icon: 'home', route: '/rider/home', label: 'Home' },
  { name: 'booking', icon: 'location-on', route: '/rider/booking', label: 'Book' },
  { name: 'rides', icon: 'history', route: '/rider/rides-history', label: 'Rides' },
  { name: 'notifications', icon: 'notifications', route: '/rider/notifications', label: 'Alerts' },
  { name: 'profile', icon: 'person', route: '/rider/profile', label: 'Profile' },
];

export default function RiderBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
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
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      borderTopColor: colors.border,
    }]}>
      {navItems.map((item) => {
        const active = isActive(item.route);
        const showDriverRideBadge = isDriverArea && item.name === 'rides' && availableRideCount > 0;
        const badgeText = newRideCount > 0 ? `New ${newRideCount}` : String(availableRideCount);
        return (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.navItem,
              active && styles.navItemActive,
            ]}
            onPress={() => handleNavigation(item.route)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                active && {
                  backgroundColor: colors.primary + '15',
                  borderRadius: 12,
                  padding: 8,
                },
              ]}
            >
              {item.iconFamily === 'community' ? (
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={24}
                  color={active ? colors.primary : colors.textSecondary}
                />
              ) : (
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={active ? colors.primary : colors.textSecondary}
                />
              )}
              {showDriverRideBadge && (
                <View style={[styles.badge, { backgroundColor: newRideCount > 0 ? '#EF4444' : colors.primary }]}>
                  <Text style={styles.badgeText}>{badgeText}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.primary : colors.textSecondary,
                  fontWeight: active ? '700' : '500',
                  fontSize: active ? 11 : 10,
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {active && (
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
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
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  navItemActive: {
    // Additional styling for active state
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -18,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    marginTop: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
  },
});
