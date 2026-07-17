import { getStorageJson, setStorageJson, STORAGE_KEYS } from "@/utils/storage";

export const RAID_CALIBRATION_SCHEMA_VERSION = 2;
export const RAID_CALIBRATION_MAX_OBSERVATIONS = 100;
export const RAID_CALIBRATION_MIN_SAMPLES = 5;
export const RAID_CALIBRATION_MIN_DODGE_ATTEMPTS = 10;

export type RaidCalibrationPredictionSource =
  "group-estimate" | "custom-party" | "optimized-party";

export type RaidObservationActual = {
  outcome: "cleared" | "timed-out";
  trainerCount: number;
  clearTimeSeconds: number;
  remainingBossHpPercent: number | null;
  faints: number;
  relobbies: number;
  dodgeAttempts: number;
  successfulDodges: number;
  latencyMs: number | null;
};

export type RaidObservationPrediction = {
  clearTimeSeconds: number;
  faints: number;
  relobbies: number;
  winRate: number;
  p10ClearTimeSeconds: number | null;
  p90ClearTimeSeconds: number | null;
};

export type RaidCalibrationObservation = {
  schemaVersion: number;
  id: string;
  ownerKey: string;
  recordedAt: string;
  modelVersion: number;
  catalogVersion: string;
  bossVariantId: string;
  bossName: string;
  tierKey: string;
  predictionSource: RaidCalibrationPredictionSource;
  scenarioKey: string;
  dodgeCalibrationApplied: boolean;
  predicted: RaidObservationPrediction;
  actual: RaidObservationActual;
};

export type RaidCalibrationProfile = {
  sampleCount: number;
  clearSampleCount: number;
  timedOutSampleCount: number;
  exactPartySampleCount: number;
  optimizedPartySampleCount: number;
  bossCount: number;
  meanAbsoluteTimingErrorSeconds: number;
  meanAbsoluteTimingErrorPercent: number;
  timingBiasSeconds: number;
  p90AbsoluteTimingErrorSeconds: number;
  predictionIntervalCoverage: number | null;
  predictedOutcomeAccuracy: number;
  meanAbsoluteFaintError: number;
  meanAbsoluteRelobbyError: number;
  dodgeAttempts: number;
  successfulDodges: number;
  dodgeSuccessRate: number;
  medianLatencyMs: number | null;
  canApplyDodgeCalibration: boolean;
};

export type CreateRaidCalibrationObservationInput = Omit<
  RaidCalibrationObservation,
  "schemaVersion" | "id" | "recordedAt"
> & {
  id?: string;
  recordedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isNonnegativeInteger = (value: unknown): value is number =>
  isFiniteNumber(value) && Number.isInteger(value) && value >= 0;

const isNonnegativeFiniteNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0;

const isPositiveFiniteNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0;

const isUnitNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0 && value <= 1;

const isNullablePositiveFiniteNumber = (
  value: unknown,
): value is number | null => value === null || isPositiveFiniteNumber(value);

const isPredictionSource = (
  value: unknown,
): value is RaidCalibrationPredictionSource =>
  value === "group-estimate" ||
  value === "custom-party" ||
  value === "optimized-party";

const isPrediction = (value: unknown): value is RaidObservationPrediction =>
  isRecord(value) &&
  isPositiveFiniteNumber(value.clearTimeSeconds) &&
  isNonnegativeFiniteNumber(value.faints) &&
  isNonnegativeFiniteNumber(value.relobbies) &&
  isUnitNumber(value.winRate) &&
  isNullablePositiveFiniteNumber(value.p10ClearTimeSeconds) &&
  isNullablePositiveFiniteNumber(value.p90ClearTimeSeconds);

const isActual = (value: unknown): value is RaidObservationActual =>
  isRecord(value) &&
  (value.outcome === "cleared" || value.outcome === "timed-out") &&
  isNonnegativeInteger(value.trainerCount) &&
  value.trainerCount >= 1 &&
  value.trainerCount <= 20 &&
  isPositiveFiniteNumber(value.clearTimeSeconds) &&
  isNullableFiniteNumber(value.remainingBossHpPercent) &&
  (value.remainingBossHpPercent === null ||
    (value.remainingBossHpPercent >= 0 &&
      value.remainingBossHpPercent <= 100)) &&
  isNonnegativeInteger(value.faints) &&
  isNonnegativeInteger(value.relobbies) &&
  isNonnegativeInteger(value.dodgeAttempts) &&
  isNonnegativeInteger(value.successfulDodges) &&
  isNullableFiniteNumber(value.latencyMs) &&
  (value.latencyMs === null || value.latencyMs >= 0) &&
  value.successfulDodges <= value.dodgeAttempts;

export const isRaidCalibrationObservation = (
  value: unknown,
): value is RaidCalibrationObservation =>
  isRecord(value) &&
  value.schemaVersion === RAID_CALIBRATION_SCHEMA_VERSION &&
  typeof value.id === "string" &&
  typeof value.ownerKey === "string" &&
  typeof value.recordedAt === "string" &&
  isFiniteNumber(value.modelVersion) &&
  typeof value.catalogVersion === "string" &&
  typeof value.bossVariantId === "string" &&
  typeof value.bossName === "string" &&
  typeof value.tierKey === "string" &&
  isPredictionSource(value.predictionSource) &&
  typeof value.scenarioKey === "string" &&
  typeof value.dodgeCalibrationApplied === "boolean" &&
  isPrediction(value.predicted) &&
  isActual(value.actual);

export const loadRaidCalibrationObservations =
  (): RaidCalibrationObservation[] => {
    const stored = getStorageJson<unknown>(
      STORAGE_KEYS.raidCalibrationObservations,
    );
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((value) => {
      if (isRaidCalibrationObservation(value)) return [value];
      if (!isRecord(value) || value.schemaVersion !== 1) return [];
      const predicted = value.predicted;
      const actual = value.actual;
      if (!isRecord(predicted) || !isRecord(actual)) return [];
      const migrated = {
        ...value,
        schemaVersion: RAID_CALIBRATION_SCHEMA_VERSION,
        predictionSource: "group-estimate",
        scenarioKey: "legacy-group-estimate",
        predicted: {
          ...predicted,
          winRate: 1,
          p10ClearTimeSeconds: null,
          p90ClearTimeSeconds: null,
        },
        actual: {
          ...actual,
          outcome: "cleared",
          remainingBossHpPercent: null,
        },
      };
      return isRaidCalibrationObservation(migrated) ? [migrated] : [];
    });
  };

export const storeRaidCalibrationObservations = (
  observations: RaidCalibrationObservation[],
): RaidCalibrationObservation[] => {
  const retained = observations
    .filter(isRaidCalibrationObservation)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, RAID_CALIBRATION_MAX_OBSERVATIONS);
  setStorageJson(STORAGE_KEYS.raidCalibrationObservations, retained);
  return retained;
};

const createObservationId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `raid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createRaidCalibrationObservation = (
  input: CreateRaidCalibrationObservationInput,
): RaidCalibrationObservation => ({
  ...input,
  schemaVersion: RAID_CALIBRATION_SCHEMA_VERSION,
  id: input.id ?? createObservationId(),
  recordedAt: input.recordedAt ?? new Date().toISOString(),
});

export const appendRaidCalibrationObservation = (
  observation: RaidCalibrationObservation,
): RaidCalibrationObservation[] =>
  storeRaidCalibrationObservations([
    observation,
    ...loadRaidCalibrationObservations(),
  ]);

export const clearRaidCalibrationObservations = (
  ownerKey: string,
): RaidCalibrationObservation[] =>
  storeRaidCalibrationObservations(
    loadRaidCalibrationObservations().filter(
      (observation) => observation.ownerKey !== ownerKey,
    ),
  );

const average = (values: number[]): number =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const percentile = (values: number[], target: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * target) - 1),
  );
  return sorted[index];
};

export const analyzeRaidCalibration = (
  observations: RaidCalibrationObservation[],
): RaidCalibrationProfile => {
  const cleared = observations.filter(
    (observation) => observation.actual.outcome === "cleared",
  );
  const timingErrors = cleared.map(
    ({ predicted, actual }) =>
      predicted.clearTimeSeconds - actual.clearTimeSeconds,
  );
  const dodgeAttempts = observations.reduce(
    (sum, observation) => sum + observation.actual.dodgeAttempts,
    0,
  );
  const successfulDodges = observations.reduce(
    (sum, observation) => sum + observation.actual.successfulDodges,
    0,
  );
  const dodgeSuccessRate =
    dodgeAttempts > 0 ? successfulDodges / dodgeAttempts : 1;
  const intervalObservations = cleared.filter(
    ({ predicted }) =>
      predicted.p10ClearTimeSeconds != null &&
      predicted.p90ClearTimeSeconds != null,
  );

  return {
    sampleCount: observations.length,
    clearSampleCount: cleared.length,
    timedOutSampleCount: observations.length - cleared.length,
    exactPartySampleCount: observations.filter(
      (observation) => observation.predictionSource !== "group-estimate",
    ).length,
    optimizedPartySampleCount: observations.filter(
      (observation) => observation.predictionSource === "optimized-party",
    ).length,
    bossCount: new Set(
      observations.map((observation) => observation.bossVariantId),
    ).size,
    meanAbsoluteTimingErrorSeconds: average(
      timingErrors.map((error) => Math.abs(error)),
    ),
    meanAbsoluteTimingErrorPercent: average(
      cleared.map(
        ({ predicted, actual }) =>
          Math.abs(predicted.clearTimeSeconds - actual.clearTimeSeconds) /
          Math.max(1, actual.clearTimeSeconds),
      ),
    ),
    timingBiasSeconds: average(timingErrors),
    p90AbsoluteTimingErrorSeconds: percentile(
      timingErrors.map((error) => Math.abs(error)),
      0.9,
    ),
    predictionIntervalCoverage:
      intervalObservations.length === 0
        ? null
        : average(
            intervalObservations.map(({ predicted, actual }) =>
              actual.clearTimeSeconds >= predicted.p10ClearTimeSeconds! &&
              actual.clearTimeSeconds <= predicted.p90ClearTimeSeconds!
                ? 1
                : 0,
            ),
          ),
    predictedOutcomeAccuracy: average(
      observations.map(({ predicted, actual }) =>
        predicted.winRate >= 0.5 === (actual.outcome === "cleared") ? 1 : 0,
      ),
    ),
    meanAbsoluteFaintError: average(
      observations.map(({ predicted, actual }) =>
        Math.abs(predicted.faints - actual.faints),
      ),
    ),
    meanAbsoluteRelobbyError: average(
      observations.map(({ predicted, actual }) =>
        Math.abs(predicted.relobbies - actual.relobbies),
      ),
    ),
    dodgeAttempts,
    successfulDodges,
    dodgeSuccessRate,
    medianLatencyMs: median(
      observations.flatMap((observation) =>
        observation.actual.latencyMs == null
          ? []
          : [observation.actual.latencyMs],
      ),
    ),
    canApplyDodgeCalibration:
      observations.length >= RAID_CALIBRATION_MIN_SAMPLES &&
      dodgeAttempts >= RAID_CALIBRATION_MIN_DODGE_ATTEMPTS,
  };
};
