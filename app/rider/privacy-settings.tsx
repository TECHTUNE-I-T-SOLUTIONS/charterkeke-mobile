import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [privacySettings, setPrivacySettings] = useState({
    shareProfile: true,
    shareRideHistory: false,
    shareLocation: true,
    allowNotifications: true,
    allowMarketing: false,
    allowThirdParty: false,
  });

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const privacyOptions = [
    {
      id: 'shareProfile',
      label: 'Share Profile',
      description: 'Allow others to see your profile information',
      icon: 'account'
    },
    {
      id: 'shareRideHistory',
      label: 'Share Ride History',
      description: 'Allow access to your ride history',
      icon: 'history'
    },
    {
      id: 'shareLocation',
      label: 'Share Location',
      description: 'Allow Charter Keke to track your location during rides',
      icon: 'map-marker'
    },
    {
      id: 'allowNotifications',
      label: 'Allow Notifications',
      description: 'Receive ride updates and promotional notifications',
      icon: 'bell'
    },
    {
      id: 'allowMarketing',
      label: 'Marketing Communications',
      description: 'Receive marketing emails and promotions',
      icon: 'email'
    },
    {
      id: 'allowThirdParty',
      label: 'Third Party Sharing',
      description: 'Share data with trusted third-party partners',
      icon: 'share-variant'
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.card || colors.surfaceLight }]}>
          <MaterialCommunityIcons name="shield-lock" size={32} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Control how your data is used and shared
          </Text>
        </View>

        {/* Settings List */}
        <View style={styles.settingsSection}>
          {privacyOptions.map((option) => (
            <View
              key={option.id}
              style={[
                styles.settingItem,
                { borderColor: colors.border, backgroundColor: colors.card || colors.background }
              ]}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons 
                  name={option.icon as any} 
                  size={20} 
                  color={colors.primary} 
                />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={privacySettings[option.id as keyof typeof privacySettings]}
                onValueChange={() => handleToggle(option.id as keyof typeof privacySettings)}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={privacySettings[option.id as keyof typeof privacySettings] ? colors.primary : colors.border}
              />
            </View>
          ))}
        </View>

        {/* Data Download */}
        <View style={styles.dataSection}>
          <TouchableOpacity
            style={[
              styles.dataButton,
              { backgroundColor: colors.card || colors.background, borderColor: colors.primary }
            ]}
          >
            <MaterialCommunityIcons name="download" size={20} color={colors.primary} />
            <Text style={[styles.dataButtonText, { color: colors.primary }]}>
              Download My Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dataButton,
              { backgroundColor: colors.card || colors.background, borderColor: colors.destructive }
            ]}
          >
            <MaterialCommunityIcons name="delete" size={20} color={colors.destructive} />
            <Text style={[styles.dataButtonText, { color: colors.destructive }]}>
              Delete My Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  dataSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    gap: 8,
  },
  dataButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
