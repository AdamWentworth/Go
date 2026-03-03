import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'pgn_mobile_device_id_v1';
const LAST_EVENTS_TS_KEY = 'pgn_mobile_events_last_ts_v1';

const generateDeviceId = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `device-${Date.now().toString(36)}-${random}`;
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const next = generateDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, next);
  return next;
};

export const loadLastEventsTimestamp = async (): Promise<number | null> => {
  const raw = await SecureStore.getItemAsync(LAST_EVENTS_TS_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

export const saveLastEventsTimestamp = async (timestamp: number): Promise<void> => {
  await SecureStore.setItemAsync(LAST_EVENTS_TS_KEY, String(timestamp));
};
