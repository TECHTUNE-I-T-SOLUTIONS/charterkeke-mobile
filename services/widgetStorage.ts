import { NativeModules, Platform } from 'react-native';

const WidgetStorageModule = NativeModules.WidgetStorage as
  | {
      setItem?: (key: string, value: string) => Promise<boolean>;
      getItem?: (key: string) => Promise<string | null>;
    }
  | undefined;

const isAvailable = Platform.OS === 'android' && !!WidgetStorageModule;

export const WidgetStorage = {
  async setItem(key: string, value: unknown) {
    if (!isAvailable || !WidgetStorageModule?.setItem) return false;
    await WidgetStorageModule.setItem(key, JSON.stringify(value));
    return true;
  },
  async getItem<T = any>(key: string): Promise<T | null> {
    if (!isAvailable || !WidgetStorageModule?.getItem) return null;
    const raw = await WidgetStorageModule.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  },
};

export const WIDGET_STORAGE_KEYS = {
  rider: 'widget_rider_data',
  driver: 'widget_driver_data',
} as const;
