import { NativeModules, Platform } from 'react-native';
import type { DeliveryInfo, DeliveryState } from './DroptrackLive.types';

const Module = NativeModules.DroptrackLive || NativeModules.DroptrackLiveModule || null;

export function isSupported(): boolean {
  if (!Module) return false;
  if (Platform.OS === 'ios') return Module.isSupported?.() ?? false;
  if (Platform.OS === 'android') return Module.isSupported?.() ?? false;
  return false;
}

export async function startDelivery(info: DeliveryInfo, state: DeliveryState): Promise<string> {
  if (!Module) throw new Error('DroptrackLive native module not found');
  return Module.startDelivery(info, state);
}

export async function updateDelivery(id: string, state: DeliveryState): Promise<void> {
  if (!Module) throw new Error('DroptrackLive native module not found');
  return Module.updateDelivery(id, state);
}

export async function endDelivery(id: string, state: DeliveryState, dismissAfterSeconds?: number): Promise<void> {
  if (!Module) throw new Error('DroptrackLive native module not found');
  return Module.endDelivery(id, state, dismissAfterSeconds ?? 0);
}

export function areActivitiesEnabled(): boolean {
  if (!Module) return false;
  return Module.areActivitiesEnabled?.() ?? true;
}
