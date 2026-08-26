import * as SecureStore from 'expo-secure-store';
import {
  clearNativeRaidObservations,
  loadNativeRaidObservations,
  saveNativeRaidObservations,
  serializeNativeRaidObservations,
  summarizeNativeRaidCalibration,
  type NativeRaidObservation,
} from '../../../src/features/tools/nativeRaidCalibration';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);
const observation = (overrides: Partial<NativeRaidObservation> = {}): NativeRaidObservation => ({
  actualCleared: true,
  actualSeconds: 110,
  createdAt: '2026-08-26T00:00:00.000Z',
  dodgeAttempts: 3,
  dodgeSuccesses: 2,
  exactParty: true,
  id: 'raid-1',
  latencyMs: 120,
  predictedCleared: true,
  predictedSeconds: 100,
  ...overrides,
});

describe('native raid calibration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('summarizes prediction accuracy, timing error, and dodge evidence', () => {
    const rows = Array.from({ length: 5 }, (_, index) => observation({ id: `raid-${index}`, dodgeAttempts: 3, dodgeSuccesses: 2 }));
    const profile = summarizeNativeRaidCalibration(rows);
    expect(profile).toMatchObject({
      canApplyDodgeCalibration: true,
      clearSampleCount: 5,
      dodgeAttempts: 15,
      exactPartySampleCount: 5,
      predictedOutcomeAccuracy: 1,
      sampleCount: 5,
    });
    expect(profile.dodgeSuccessRate).toBeCloseTo(2 / 3);
    expect(profile.meanAbsoluteTimingErrorPercent).toBeCloseTo(10 / 110);
  });

  it('loads, stores, clears, and exports a bounded device-only log', async () => {
    secureStore.getItemAsync.mockResolvedValue(JSON.stringify([observation()]));
    expect(await loadNativeRaidObservations()).toHaveLength(1);
    await saveNativeRaidObservations([observation()]);
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(expect.stringContaining('raid-observations'), expect.stringContaining('raid-1'));
    await clearNativeRaidObservations();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(expect.stringContaining('raid-observations'));
    expect(serializeNativeRaidObservations([observation()])).toContain('"schemaVersion": 1');
  });
});
