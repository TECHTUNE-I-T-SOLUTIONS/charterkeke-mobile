/**
 * Push Notification Settings Component
 * Shows toggle to subscribe/unsubscribe from push notifications
 * Place this in your Profile or Settings screen
 */

import React from 'react';
import { View, Text, Switch, ActivityIndicator, Alert } from 'react-native';
import { usePushNotificationToggle } from '../hooks/usePushNotificationToggle';
import { useTheme } from '../context/ThemeContext';

interface PushNotificationSettingsProps {
  userId?: string;
  showLabel?: boolean;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
  userId,
  showLabel = true,
}) => {
  const theme = useTheme();
  const isDarkMode = (theme as any)?.isDarkMode || false;
  const { isSubscribed, isLoading, error, toggleSubscription } = usePushNotificationToggle();

  const handleToggle = async () => {
    try {
      await toggleSubscription();
    } catch (err) {
      Alert.alert(
        'Notification Setting',
        'Failed to update preference. Please try again.'
      );
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Updating...';
    if (error) return 'Error loading...';
    return isSubscribed ? 'Enabled' : 'Disabled';
  };

  const getStatusColor = () => {
    if (isLoading) return isDarkMode ? '#888' : '#999';
    if (error) return '#E74C3C';
    return isSubscribed ? '#27AE60' : '#95A5A6';
  };

  return (
    <View
      style={{
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#333' : '#ECEFF1',
        backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          {showLabel && (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                marginBottom: 4,
              }}
            >
              Push Notifications
            </Text>
          )}
          <Text
            style={{
              fontSize: 13,
              color: getStatusColor(),
              fontWeight: '500',
            }}
          >
            {getStatusText()}
          </Text>
          {error && (
            <Text
              style={{
                fontSize: 12,
                color: '#E74C3C',
                marginTop: 4,
                fontStyle: 'italic',
              }}
            >
              {error}
            </Text>
          )}
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? '#AAA' : '#666',
              marginTop: 4,
            }}
          >
            Get alerts for rides, messages, and updates
          </Text>
        </View>

        <View style={{ marginLeft: 12 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#F18902" />
          ) : (
            <Switch
              value={isSubscribed}
              onValueChange={handleToggle}
              disabled={isLoading || Boolean(error)}
              trackColor={{
                false: isDarkMode ? '#444' : '#CCCCCC',
                true: '#F18902',
              }}
              thumbColor={isSubscribed ? '#E68200' : isDarkMode ? '#555' : '#FFFFFF'}
            />
          )}
        </View>
      </View>
    </View>
  );
};

/**
 * Wrapper for Profile Screen Integration
 * Usage in Profile screen:
 * 
 * import { PushNotificationSettingsSection } from '@/components/PushNotificationSettings';
 * 
 * In your profile screen render:
 * - PushNotificationSettingsSection component
 * - Other profile settings
 */
export const PushNotificationSettingsSection: React.FC = () => {
  return (
    <View>
      <PushNotificationSettings showLabel={true} />
    </View>
  );
};

export default PushNotificationSettings;
