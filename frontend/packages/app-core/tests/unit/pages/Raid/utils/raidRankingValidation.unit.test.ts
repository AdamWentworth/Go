import { describe, expect, it } from "vitest";

import {
  canonicalOverallExpectation,
  canonicalOverallRaidAttackers,
} from "@/../tests/__helpers__/raidCanonicalAttackers";
import {
  DEFAULT_RAID_NEUTRAL_BENCHMARK,
  scoreBestRaidOverallAttackers,
  type RaidCounterSettings,
  type RaidNeutralBenchmark,
} from "@/pages/Raid/utils/raidCalculations";
import {
  RAID_COLD_ROUTE_READY_BUDGET_MS,
  RAID_COUNTER_SIMULATION_VARIANT_LIMIT,
  RAID_MONTE_CARLO_MAX_SAMPLES,
  RAID_MONTE_CARLO_MIN_SAMPLES,
  RAID_ROUTE_READY_MEASURE,
  RAID_SIMULATION_MODEL_VERSION,
  RAID_WARM_ROUTE_READY_BUDGET_MS,
} from "@/pages/Raid/utils/raidRules";
import validationProfile from "../../../../../../../../docs/raid-ranking-validation.json";

const defaultSettings: RaidCounterSettings = {
  attackerLevel: "50.0",
  friendship: "none",
  megaAllyBonus: "none",
  partyPower: "none",
  dodgeStrategy: "none",
  weatherBoostedType: "",
  shadowBossMode: "normal",
  bossMovesetMode: "expected",
  relobbySeconds: 10,
};

const benchmarkScenarios: RaidNeutralBenchmark[] = [160, 180, 200].flatMap(
  (targetDefense) =>
    [0.8, 1, 1.2].map((pressureMultiplier) => ({
      targetDefense,
      incomingDamageNumerator:
        DEFAULT_RAID_NEUTRAL_BENCHMARK.incomingDamageNumerator *
        pressureMultiplier,
      incomingChargedDamageNumerator:
        DEFAULT_RAID_NEUTRAL_BENCHMARK.incomingChargedDamageNumerator *
        pressureMultiplier,
    })),
);

const summarizeTop = (benchmark = DEFAULT_RAID_NEUTRAL_BENCHMARK) =>
  scoreBestRaidOverallAttackers(
    canonicalOverallRaidAttackers,
    defaultSettings,
    undefined,
    benchmark,
  )
    .slice(0, canonicalOverallExpectation.length)
    .map((score) => ({
      name: score.variant.name,
      fastMove: score.fastMove.name,
      chargedMove: score.chargedMove.name,
    }));

const canonicalTopNames = canonicalOverallExpectation.map(
  (expectation) => expectation.name,
);

const summarizeCanonicalOrder = () =>
  scoreBestRaidOverallAttackers(
    canonicalOverallRaidAttackers,
    defaultSettings,
  ).map((score) => score.variant.name);

describe("raid ranking validation", () => {
  it("keeps the machine-readable validation profile aligned with the model", () => {
    expect(validationProfile.modelVersion).toBe(
      RAID_SIMULATION_MODEL_VERSION,
    );
    expect(validationProfile.bossSimulation.finalistLimit).toBe(
      RAID_COUNTER_SIMULATION_VARIANT_LIMIT,
    );
    expect(validationProfile.bossSimulation.monteCarloSamples).toEqual({
      minimum: RAID_MONTE_CARLO_MIN_SAMPLES,
      maximum: RAID_MONTE_CARLO_MAX_SAMPLES,
    });
    expect(validationProfile.canonicalOverall).toEqual(
      canonicalOverallExpectation,
    );
    expect(validationProfile.performanceBudgets).toEqual({
      measure: RAID_ROUTE_READY_MEASURE,
      coldMilliseconds: RAID_COLD_ROUTE_READY_BUDGET_MS,
      warmMilliseconds: RAID_WARM_ROUTE_READY_BUDGET_MS,
      initialViewMayDeferRaidMetadata: true,
    });
    expect(validationProfile.externalCalibration.requiredLeader).toEqual(
      canonicalOverallExpectation[0],
    );
  });

  it("stays within the versioned independent-reference tolerances", () => {
    const calibration = validationProfile.externalCalibration;
    const localOrder = summarizeCanonicalOrder();
    const localTopThree = new Set(localOrder.slice(0, 3));

    expect(calibration.references.length).toBeGreaterThanOrEqual(
      calibration.tolerances.minimumIndependentReferences,
    );

    calibration.references.forEach((reference) => {
      expect(reference.releasedTopCohort[0]).toBe(
        calibration.requiredLeader.name,
      );
      const overlap = reference.releasedTopCohort.filter((name) =>
        localTopThree.has(name),
      ).length;
      expect(overlap / 3).toBeGreaterThanOrEqual(
        calibration.tolerances.minimumTopThreeReferenceOverlap,
      );

      const sharedNames = new Set(reference.sharedCanonicalOrder);
      const localSharedOrder = localOrder.filter((name) =>
        sharedNames.has(name),
      );
      reference.sharedCanonicalOrder.forEach((name, expectedIndex) => {
        expect(
          Math.abs(localSharedOrder.indexOf(name) - expectedIndex),
        ).toBeLessThanOrEqual(
          calibration.tolerances.maximumSharedCanonicalRankDisplacement,
        );
      });
    });
  });

  it("records a full-simulator boss-counter calibration cohort", () => {
    const reference =
      validationProfile.externalCalibration.bossSpecificReference;

    expect(reference.tool).toBe("Pokebattler");
    expect(reference.boss).toBe("Rayquaza");
    expect(reference.topCounterCohort).toHaveLength(6);
    expect(reference.topCounterCohort).toEqual(
      expect.arrayContaining([
        "White Kyurem",
        "Black Kyurem",
        "Shadow Mamoswine",
      ]),
    );
  });

  it("matches the canonical headline order and legal movesets", () => {
    expect(summarizeTop()).toEqual(canonicalOverallExpectation);
  });

  it.each(benchmarkScenarios)(
    "keeps the canonical top three stable at defense $targetDefense and incoming numerator $incomingDamageNumerator",
    (benchmark) => {
      const scores = summarizeTop(benchmark);

      expect(scores.map((score) => score.name)).toEqual(canonicalTopNames);
      expect(scores[0]?.chargedMove).toBe("Dragon Ascent");
      expect(scores[1]?.chargedMove).toBe("Psystrike");
      expect(scores[2]?.chargedMove).toBe("Psystrike");
      expect(scores.map((score) => score.chargedMove)).not.toContain(
        "Shadow Ball",
      );
    },
  );

  it.each([0, 5, 10, 20])(
    "keeps the canonical top three stable with a %ss relobby",
    (relobbySeconds) => {
      const scores = scoreBestRaidOverallAttackers(
        canonicalOverallRaidAttackers,
        { ...defaultSettings, relobbySeconds },
      )
        .slice(0, canonicalOverallExpectation.length)
        .map((score) => ({
          name: score.variant.name,
          fastMove: score.fastMove.name,
          chargedMove: score.chargedMove.name,
        }));

      expect(scores).toEqual(canonicalOverallExpectation);
    },
  );
});
