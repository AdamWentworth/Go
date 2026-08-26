import * as SecureStore from 'expo-secure-store';

export type NativeRaidObservation = {
  actualCleared: boolean;
  actualSeconds: number | null;
  createdAt: string;
  dodgeAttempts: number;
  dodgeSuccesses: number;
  exactParty: boolean;
  id: string;
  latencyMs: number | null;
  predictedCleared: boolean;
  predictedSeconds: number | null;
};

export type NativeRaidCalibrationProfile = {
  canApplyDodgeCalibration: boolean;
  clearSampleCount: number;
  dodgeAttempts: number;
  dodgeSuccessRate: number;
  exactPartySampleCount: number;
  meanAbsoluteTimingErrorPercent: number;
  medianLatencyMs: number | null;
  p90AbsoluteTimingErrorSeconds: number;
  predictedOutcomeAccuracy: number;
  sampleCount: number;
};

const STORAGE_KEY = 'pokegonexus.native.raid-observations.v1';

const finiteNonNegative = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const normalizeNativeRaidObservations = (value: unknown): NativeRaidObservation[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const row = candidate as Partial<NativeRaidObservation>;
    if (typeof row.id !== 'string' || typeof row.createdAt !== 'string') return [];
    return [{
      actualCleared: Boolean(row.actualCleared),
      actualSeconds: finiteNonNegative(row.actualSeconds),
      createdAt: row.createdAt,
      dodgeAttempts: Math.max(0, Math.round(finiteNonNegative(row.dodgeAttempts) ?? 0)),
      dodgeSuccesses: Math.max(0, Math.round(finiteNonNegative(row.dodgeSuccesses) ?? 0)),
      exactParty: Boolean(row.exactParty),
      id: row.id,
      latencyMs: finiteNonNegative(row.latencyMs),
      predictedCleared: Boolean(row.predictedCleared),
      predictedSeconds: finiteNonNegative(row.predictedSeconds),
    }];
  }).slice(-100);
};

export const loadNativeRaidObservations = async (): Promise<NativeRaidObservation[]> => {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!stored) return [];
  try { return normalizeNativeRaidObservations(JSON.parse(stored)); } catch { return []; }
};

export const saveNativeRaidObservations = async (observations: NativeRaidObservation[]): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(normalizeNativeRaidObservations(observations)));
};

export const clearNativeRaidObservations = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
};

const percentile = (values: number[], fraction: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))] ?? 0;
};

export const summarizeNativeRaidCalibration = (observations: NativeRaidObservation[]): NativeRaidCalibrationProfile => {
  const timingRows = observations.flatMap((row) => (
    row.actualCleared && row.predictedCleared && row.actualSeconds != null && row.predictedSeconds != null && row.actualSeconds > 0
      ? [{ absoluteSeconds: Math.abs(row.actualSeconds - row.predictedSeconds), absolutePercent: Math.abs(row.actualSeconds - row.predictedSeconds) / row.actualSeconds }]
      : []
  ));
  const dodgeAttempts = observations.reduce((sum, row) => sum + row.dodgeAttempts, 0);
  const dodgeSuccesses = observations.reduce((sum, row) => sum + Math.min(row.dodgeAttempts, row.dodgeSuccesses), 0);
  const latencies = observations.flatMap((row) => row.latencyMs == null ? [] : [row.latencyMs]);
  const accurate = observations.filter((row) => row.actualCleared === row.predictedCleared).length;
  return {
    canApplyDodgeCalibration: observations.length >= 5 && dodgeAttempts >= 10,
    clearSampleCount: timingRows.length,
    dodgeAttempts,
    dodgeSuccessRate: dodgeAttempts > 0 ? dodgeSuccesses / dodgeAttempts : 0,
    exactPartySampleCount: observations.filter((row) => row.exactParty).length,
    meanAbsoluteTimingErrorPercent: timingRows.length > 0 ? timingRows.reduce((sum, row) => sum + row.absolutePercent, 0) / timingRows.length : 0,
    medianLatencyMs: latencies.length > 0 ? percentile(latencies, .5) : null,
    p90AbsoluteTimingErrorSeconds: percentile(timingRows.map((row) => row.absoluteSeconds), .9),
    predictedOutcomeAccuracy: observations.length > 0 ? accurate / observations.length : 0,
    sampleCount: observations.length,
  };
};

export const serializeNativeRaidObservations = (observations: NativeRaidObservation[]): string => JSON.stringify({
  exportedAt: new Date().toISOString(),
  observations: normalizeNativeRaidObservations(observations),
  schemaVersion: 1,
}, null, 2);
