import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

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
  const { theme } = useTheme();

  const getNavItems = () => {
    if (pathname.includes('/driver')) {
      return DRIVER_NAV_ITEMS;
    }
    return RIDER_NAV_ITEMS;
  };

  const navItems = getNavItems();
  const isActive = (route: string) => pathname === route;

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
    }]}>
      {navItems.map((item) => {
        const active = isActive(item.route);
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.push(item.route)}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={active ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: active ? '600' : '400',
                },
              ]}
            >
              {item.label}
            </Text>
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
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
});
