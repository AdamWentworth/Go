import { beforeAll, describe, expect, it } from "vitest";

import {
  canonicalOverallExpectation,
  canonicalOverallRaidAttackers,
} from "@/../tests/__helpers__/raidCanonicalAttackers";
import createPokemonVariants from "@/features/variants/utils/createPokemonVariants";
import {
  RAID_TIER_PRESETS,
  dedupeBestCounterPerVariant,
  getRaidTierKeyForVariant,
  isEligibleRaidAttacker,
  isEligibleRaidBoss,
  scoreBestRaidOverallAttackers,
  scoreRaidCounters,
  type RaidCounterSettings,
} from "@/pages/Raid/utils/raidCalculations";
import { getRaidVariantDisplayName } from "@/pages/Raid/utils/raidViewModel";
import type { BasePokemon } from "@/types/pokemonBase";
import type { PokemonVariant } from "@/types/pokemonVariants";
import validationProfile from "../../../../../../../docs/raid-ranking-validation.json";

const catalogApiUrl = process.env.RAID_CATALOG_VALIDATION_URL
  ?.trim()
  .replace(/\/+$/, "");
const runLiveValidation =
  process.env.RUN_LIVE_RAID_CATALOG_VALIDATION === "1";

if (runLiveValidation && !catalogApiUrl) {
  throw new Error(
    "RAID_CATALOG_VALIDATION_URL is required for live raid catalog validation.",
  );
}

const liveCatalogDescribe = runLiveValidation ? describe : describe.skip;

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

liveCatalogDescribe("live raid catalog validation", () => {
  let variants: PokemonVariant[] = [];

  beforeAll(async () => {
    const response = await fetch(`${catalogApiUrl}/pokemons`);
    expect(response.ok).toBe(true);

    const payload: unknown = await response.json();
    expect(Array.isArray(payload)).toBe(true);
    variants = createPokemonVariants(payload as BasePokemon[]);
  });

  it("preserves the canonical headline order and legal signature moves", () => {
    const cohortNames = new Set(
      canonicalOverallRaidAttackers.map((attacker) => attacker.name),
    );
    const liveCohort = variants.filter((variant) =>
      cohortNames.has(variant.name),
    );

    expect(new Set(liveCohort.map((variant) => variant.name))).toEqual(
      cohortNames,
    );

    const scores = scoreBestRaidOverallAttackers(
      liveCohort,
      defaultSettings,
      variants,
    )
      .slice(0, canonicalOverallExpectation.length)
      .map((score) => ({
        name: score.variant.name,
        fastMove: score.fastMove.name,
        chargedMove: score.chargedMove.name,
      }));

    expect(scores).toEqual(canonicalOverallExpectation);
    expect(scores.find((score) => score.name === "Mega Mewtwo Y")?.chargedMove)
      .not.toBe("Shadow Ball");

    const liveBoss = variants.find(
      (variant) =>
        variant.name === "Mewtwo" && variant.variantType === "default",
    );
    expect(liveBoss).toBeDefined();

    const counterScores = scoreRaidCounters(
      liveCohort,
      liveBoss!,
      RAID_TIER_PRESETS.legendary,
      defaultSettings,
    );
    expect(counterScores.length).toBeGreaterThan(0);
    expect(
      counterScores.every(
        (score) =>
          Number.isFinite(score.dps) &&
          Number.isFinite(score.soloTimeSeconds) &&
          score.faints >= 0 &&
          score.relobbies >= 0,
      ),
    ).toBe(true);
  });

  it("retains the configured overlap across the full-simulator boss matrix", () => {
    const matrix = validationProfile.externalCalibration.bossSpecificMatrix;
    const referenceNames = new Set(
      matrix.scenarios.flatMap((scenario) => scenario.referenceCounterCohort),
    );
    const candidates = variants.filter(
      (variant) =>
        isEligibleRaidAttacker(variant) &&
        referenceNames.has(getRaidVariantDisplayName(variant)),
    );
    const availableNames = new Set(candidates.map(getRaidVariantDisplayName));

    matrix.scenarios.forEach((scenario) => {
      const boss = variants.find(
        (variant) =>
          isEligibleRaidBoss(variant) &&
          getRaidVariantDisplayName(variant) === scenario.boss,
      );
      expect(
        boss,
        `${scenario.boss} must exist in the live catalog`,
      ).toBeDefined();
      const availableReference = scenario.referenceCounterCohort.filter(
        (name) => availableNames.has(name),
      );
      expect(
        availableReference,
        `${scenario.boss} catalog cohort: ${availableReference.join(", ")}`,
      ).toHaveLength(scenario.referenceCounterCohort.length);

      const tierKey = getRaidTierKeyForVariant(boss!) ?? "legendary";
      const localWindow = dedupeBestCounterPerVariant(
        scoreRaidCounters(
          candidates,
          boss!,
          RAID_TIER_PRESETS[tierKey],
          defaultSettings,
        ),
      )
        .slice(0, matrix.comparisonWindow)
        .map((score) => getRaidVariantDisplayName(score.variant));
      const overlap = scenario.referenceCounterCohort.filter((name) =>
        localWindow.includes(name),
      ).length;

      expect(
        overlap / scenario.referenceCounterCohort.length,
        `${scenario.boss} reference overlap`,
      ).toBeGreaterThanOrEqual(matrix.minimumReferenceCohortOverlap);
    });
  });
});
