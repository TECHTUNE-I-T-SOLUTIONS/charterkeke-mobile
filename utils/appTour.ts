export type AppTourRole = 'rider' | 'driver';

export function getTourStorageKey(role: AppTourRole) {
  return `@charter_keke_${role}_tour_seen`;
}
