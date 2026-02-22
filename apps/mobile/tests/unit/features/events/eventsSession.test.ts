import * as SecureStore from 'expo-secure-store';
import {
  getOrCreateDeviceId,
  loadLastEventsTimestamp,
  saveLastEventsTimestamp,
} from '../../../../src/features/events/eventsSession';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe('eventsSession', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns existing device id when available', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('device-abc');
    await expect(getOrCreateDeviceId()).resolves.toBe('device-abc');
  });

  it('creates and persists a new device id when missing', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const deviceId = await getOrCreateDeviceId();
    expect(deviceId).toContain('device-');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pgn_mobile_device_id_v1', deviceId);
  });

  it('loads and persists last events timestamp', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('12345');
    await expect(loadLastEventsTimestamp()).resolves.toBe(12345);

    await saveLastEventsTimestamp(67890);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pgn_mobile_events_last_ts_v1', '67890');
  });
});
