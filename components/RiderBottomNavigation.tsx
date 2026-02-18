import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { COLORS } from '@/utils/colors';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  label: string;
}

const RIDER_NAV_ITEMS: NavItem[] = [
  { name: 'home', icon: 'home', route: '/rider/home', label: 'Home' },
  { name: 'booking', icon: 'location-on', route: '/rider/booking', label: 'Book' },
  { name: 'rides', icon: 'history', route: '/rider/rides-history', label: 'Rides' },
  { name: 'wallet', icon: 'wallet', route: '/rider/wallet', label: 'Wallet' },
  { name: 'profile', icon: 'person', route: '/rider/profile', label: 'Profile' },
];

export default function RiderBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const getNavItems = () => {
    if (pathname.includes('/driver')) {
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

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      borderTopColor: colors.border,
    }]}>
      {navItems.map((item) => {
        const active = isActive(item.route);
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
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color={active ? colors.primary : colors.textSecondary}
              />
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
  { name: 'rides', icon: 'directions-car', route: '/driver/rides', label: 'Rides' },
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