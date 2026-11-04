import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from '@/services/api';

const CONSENT_KEY = '@charter_keke_experience_consent_v1';
const QUEUE_KEY = '@charter_keke_experience_queue_v1';
const REVOCATION_KEY = '@charter_keke_experience_revocation_pending_v1';
const MAX_QUEUED_EVENTS = 30;
const recentErrors = new Map<string, number>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let flushInProgress = false;

export type ExperienceEvent = {
  id: string;
  type: 'error' | 'screen_view' | 'task_success' | 'task_failure' | 'feedback';
  occurredAt: string;
  screen?: string;
  action?: string;
  durationMs?: number;
  errorName?: string;
  message?: string;
  stack?: string;
  feedback?: string;
  appVersion?: string;
  platform: string;
};

const cleanText = (value: unknown, limit: number) => String(value ?? '')
  .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
  .replace(/\b(?:\+?\d[\d ()-]{7,}\d)\b/g, '[phone]')
  .replace(/([?&](?:token|key|secret|reference|authorization)=)[^&\s]+/gi, '$1[redacted]')
  .slice(0, limit);

const eventId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function getExperienceConsent(): Promise<boolean | null> {
  try {
    const value = await AsyncStorage.getItem(CONSENT_KEY);
    return value === null ? null : value === 'granted';
  } catch {
    return false;
  }
}

export async function setExperienceConsent(granted: boolean): Promise<void> {
  const previous = await AsyncStorage.getItem(CONSENT_KEY).catch(() => null);
  await AsyncStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  if (granted) await flushExperienceQueue();
  else {
    await AsyncStorage.removeItem(QUEUE_KEY);
    if (previous === 'granted') {
      await AsyncStorage.setItem(REVOCATION_KEY, '1');
      void retryConsentRevocation();
    }
  }
}

async function retryConsentRevocation(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(REVOCATION_KEY)) {
      await apiService.delete('/mobile/experience/reports');
      await AsyncStorage.removeItem(REVOCATION_KEY);
    }
  } catch {
    // Retry when the app returns to the foreground.
  }
}

function createEvent(input: Omit<ExperienceEvent, 'id' | 'occurredAt' | 'appVersion' | 'platform'>): ExperienceEvent {
  return {
    id: eventId(),
    occurredAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version || Constants.nativeAppVersion || 'unknown',
    platform: Platform.OS,
    ...input,
    screen: input.screen ? cleanText(input.screen, 80) : undefined,
    action: input.action ? cleanText(input.action, 80) : undefined,
    errorName: input.errorName ? cleanText(input.errorName, 100) : undefined,
    message: input.message ? cleanText(input.message, 1000) : undefined,
    stack: input.stack ? cleanText(input.stack, 5000) : undefined,
    feedback: input.feedback ? cleanText(input.feedback, 800) : undefined,
  };
}

async function enqueue(event: ExperienceEvent): Promise<void> {
  if (!(await getExperienceConsent())) return;
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: ExperienceEvent[] = stored ? JSON.parse(stored) : [];
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, event].slice(-MAX_QUEUED_EVENTS)));
  } catch {
    // Reporting must never interfere with app functionality.
  }
  if (event.type === 'error' || event.type === 'task_failure' || event.type === 'feedback') {
    await flushExperienceQueue();
  } else {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void flushExperienceQueue(), 3000);
  }
}

export async function flushExperienceQueue(): Promise<void> {
  if (flushInProgress) return;
  if (!(await getExperienceConsent())) {
    await retryConsentRevocation();
    return;
  }
  flushInProgress = true;
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (!stored) return;
    const queue: ExperienceEvent[] = JSON.parse(stored);
    if (!Array.isArray(queue) || queue.length === 0) return;
    const batch = queue.slice(0, 15);
    await apiService.post('/mobile/experience/reports', { events: batch, consent: true });
    const latest = await AsyncStorage.getItem(QUEUE_KEY);
    const latestQueue: ExperienceEvent[] = latest ? JSON.parse(latest) : [];
    const sentIds = new Set(batch.map((event) => event.id));
    const remaining = latestQueue.filter((event) => !sentIds.has(event.id));
    if (remaining.length) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    else await AsyncStorage.removeItem(QUEUE_KEY);
    if (remaining.length) {
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(() => void flushExperienceQueue(), 1000);
    }
  } catch {
    // Keep the bounded queue for the next foreground/network opportunity.
  } finally {
    flushInProgress = false;
  }
}

export async function reportAppError(error: unknown, screen: string, action = 'unhandled_error'): Promise<void> {
  const value = error instanceof Error ? error : new Error(String(error));
  const fingerprint = `${screen}:${value.name}:${value.message}`;
  const now = Date.now();
  if (now - (recentErrors.get(fingerprint) || 0) < 30_000) return;
  recentErrors.set(fingerprint, now);
  if (recentErrors.size > 50) {
    for (const [key, timestamp] of recentErrors) if (now - timestamp > 30_000) recentErrors.delete(key);
  }
  await enqueue(createEvent({
    type: 'error', screen, action, errorName: value.name, message: value.message, stack: value.stack,
  }));
}

export async function recordExperience(
  type: ExperienceEvent['type'],
  screen: string,
  action: string,
  durationMs?: number,
  feedback?: string,
): Promise<void> {
  await enqueue(createEvent({ type, screen, action, durationMs: durationMs ? Math.round(durationMs) : undefined, feedback }));
}
