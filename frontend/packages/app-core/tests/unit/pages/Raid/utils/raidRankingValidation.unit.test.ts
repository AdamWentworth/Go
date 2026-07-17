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
  RAID_COUNTER_SIMULATION_VARIANT_LIMIT,
  RAID_MONTE_CARLO_MAX_SAMPLES,
  RAID_MONTE_CARLO_MIN_SAMPLES,
  RAID_SIMULATION_MODEL_VERSION,
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
    expect(validationProfile.externalReferenceSnapshot.sharedLeader).toBe(
      canonicalOverallExpectation[0].name,
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
