import Constants from 'expo-constants';
import { Platform } from 'react-native';

const expoConfig = (Constants.expoConfig || {}) as {
  name?: string;
  version?: string;
  runtimeVersion?: string | number;
  ios?: { buildNumber?: string };
  android?: { versionCode?: number | string };
};

export const APP_INFO = {
  name: expoConfig.name || 'Charter Keke',
  version: expoConfig.version || '1.0.0',
  runtimeVersion: String(expoConfig.runtimeVersion || '1'),
  build:
    Platform.OS === 'ios'
      ? String(expoConfig.ios?.buildNumber || '')
      : String(expoConfig.android?.versionCode || ''),
  company: 'Charter Keke',
  supportEmail: 'support@charterkeke.com',
  website: 'https://charterkeke.com',
};

export function getAppVersionLabel() {
  return `Version ${APP_INFO.version}${APP_INFO.build ? ` (${APP_INFO.build})` : ''}`;
}
