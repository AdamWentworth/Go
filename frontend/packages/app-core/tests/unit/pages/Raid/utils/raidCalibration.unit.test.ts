import { beforeEach, describe, expect, it } from "vitest";

import {
  RAID_CALIBRATION_MAX_OBSERVATIONS,
  analyzeRaidCalibration,
  appendRaidCalibrationObservation,
  clearRaidCalibrationObservations,
  createRaidCalibrationObservation,
  loadRaidCalibrationObservations,
  type CreateRaidCalibrationObservationInput,
} from "@/pages/Raid/utils/raidCalibration";

const observationInput = (
  overrides: Partial<CreateRaidCalibrationObservationInput> = {},
): CreateRaidCalibrationObservationInput => ({
  ownerKey: "trainer-a",
  modelVersion: 10,
  catalogVersion: "catalog-1",
  bossVariantId: "rayquaza-default",
  bossName: "Rayquaza",
  tierKey: "legendary",
  predictionSource: "custom-party",
  scenarioKey: "party-3-test",
  dodgeCalibrationApplied: false,
  predicted: {
    clearTimeSeconds: 100,
    faints: 4,
    relobbies: 0,
    winRate: 1,
    p10ClearTimeSeconds: 90,
    p90ClearTimeSeconds: 115,
  },
  actual: {
    outcome: "cleared",
    trainerCount: 3,
    clearTimeSeconds: 110,
    remainingBossHpPercent: null,
    faints: 5,
    relobbies: 1,
    dodgeAttempts: 2,
    successfulDodges: 1,
    latencyMs: 80,
  },
  ...overrides,
});

describe("raid battle calibration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("aggregates timing, survival, dodge, and diagnostic latency", () => {
    const observations = [
      createRaidCalibrationObservation(
        observationInput({ id: "one", recordedAt: "2026-07-17T01:00:00Z" }),
      ),
      createRaidCalibrationObservation(
        observationInput({
          id: "two",
          recordedAt: "2026-07-17T02:00:00Z",
          bossVariantId: "kyogre-default",
          bossName: "Kyogre",
          predicted: {
            clearTimeSeconds: 130,
            faints: 7,
            relobbies: 2,
            winRate: 1,
            p10ClearTimeSeconds: 120,
            p90ClearTimeSeconds: 140,
          },
          actual: {
            outcome: "cleared",
            trainerCount: 4,
            clearTimeSeconds: 100,
            remainingBossHpPercent: null,
            faints: 5,
            relobbies: 1,
            dodgeAttempts: 4,
            successfulDodges: 3,
            latencyMs: 120,
          },
        }),
      ),
    ];

    const profile = analyzeRaidCalibration(observations);

    expect(profile.sampleCount).toBe(2);
    expect(profile.exactPartySampleCount).toBe(2);
    expect(profile.bossCount).toBe(2);
    expect(profile.meanAbsoluteTimingErrorSeconds).toBe(20);
    expect(profile.meanAbsoluteTimingErrorPercent).toBeCloseTo(0.19545, 4);
    expect(profile.timingBiasSeconds).toBe(10);
    expect(profile.p90AbsoluteTimingErrorSeconds).toBe(30);
    expect(profile.predictionIntervalCoverage).toBe(0.5);
    expect(profile.predictedOutcomeAccuracy).toBe(1);
    expect(profile.meanAbsoluteFaintError).toBe(1.5);
    expect(profile.meanAbsoluteRelobbyError).toBe(1);
    expect(profile.dodgeAttempts).toBe(6);
    expect(profile.successfulDodges).toBe(4);
    expect(profile.dodgeSuccessRate).toBeCloseTo(2 / 3);
    expect(profile.medianLatencyMs).toBe(100);
    expect(profile.canApplyDodgeCalibration).toBe(false);
  });

  it("requires enough raids and dodge attempts before calibration applies", () => {
    const observations = Array.from({ length: 5 }, (_, index) =>
      createRaidCalibrationObservation(
        observationInput({
          id: `sample-${index}`,
          recordedAt: `2026-07-17T0${index + 1}:00:00Z`,
        }),
      ),
    );

    expect(analyzeRaidCalibration(observations)).toMatchObject({
      sampleCount: 5,
      dodgeAttempts: 10,
      successfulDodges: 5,
      dodgeSuccessRate: 0.5,
      canApplyDodgeCalibration: true,
    });
  });

  it("separates exact parties and failed raids from clear-time accuracy", () => {
    const cleared = createRaidCalibrationObservation(
      observationInput({ id: "cleared", predictionSource: "optimized-party" }),
    );
    const timedOut = createRaidCalibrationObservation(
      observationInput({
        id: "timeout",
        predictionSource: "group-estimate",
        predicted: {
          clearTimeSeconds: 150,
          faints: 10,
          relobbies: 1,
          winRate: 0.25,
          p10ClearTimeSeconds: 140,
          p90ClearTimeSeconds: 180,
        },
        actual: {
          ...observationInput().actual,
          outcome: "timed-out",
          clearTimeSeconds: 300,
          remainingBossHpPercent: 18,
        },
      }),
    );

    expect(analyzeRaidCalibration([cleared, timedOut])).toMatchObject({
      sampleCount: 2,
      clearSampleCount: 1,
      timedOutSampleCount: 1,
      exactPartySampleCount: 1,
      optimizedPartySampleCount: 1,
      meanAbsoluteTimingErrorSeconds: 10,
      predictedOutcomeAccuracy: 1,
    });
  });

  it("isolates owners, discards malformed records, and caps retention", () => {
    const malformed = { schemaVersion: 1, id: "bad" };
    const impossible = createRaidCalibrationObservation(
      observationInput({
        id: "impossible",
        actual: {
          ...observationInput().actual,
          trainerCount: 0,
        },
      }),
    );
    localStorage.setItem(
      "raidCalibrationObservations",
      JSON.stringify([malformed, impossible]),
    );
    expect(loadRaidCalibrationObservations()).toEqual([]);

    for (
      let index = 0;
      index < RAID_CALIBRATION_MAX_OBSERVATIONS + 5;
      index += 1
    ) {
      appendRaidCalibrationObservation(
        createRaidCalibrationObservation(
          observationInput({
            id: `trainer-a-${index}`,
            recordedAt: new Date(Date.UTC(2026, 6, 17, 0, index)).toISOString(),
          }),
        ),
      );
    }
    appendRaidCalibrationObservation(
      createRaidCalibrationObservation(
        observationInput({
          id: "trainer-b",
          ownerKey: "trainer-b",
          recordedAt: "2026-07-18T00:00:00Z",
        }),
      ),
    );

    expect(loadRaidCalibrationObservations()).toHaveLength(
      RAID_CALIBRATION_MAX_OBSERVATIONS,
    );
    const retained = clearRaidCalibrationObservations("trainer-a");
    expect(retained).toHaveLength(1);
    expect(retained[0]?.ownerKey).toBe("trainer-b");
  });
});
