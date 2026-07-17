import { describe, expect, it } from "vitest";

import {
  canonicalOverallExpectation,
  canonicalOverallRaidAttackers,
} from "@/../tests/__helpers__/raidCanonicalAttackers";
import createPokemonVariants from "@/features/variants/utils/createPokemonVariants";
import {
  scoreBestRaidOverallAttackers,
  type RaidCounterSettings,
} from "@/pages/Raid/utils/raidCalculations";
import type { BasePokemon } from "@/types/pokemonBase";

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
  weatherBoostedType: "",
  shadowBossMode: "normal",
  bossMovesetMode: "expected",
  relobbySeconds: 10,
};

liveCatalogDescribe("live raid catalog validation", () => {
  it("preserves the canonical headline order and legal signature moves", async () => {
    const response = await fetch(`${catalogApiUrl}/pokemons`);
    expect(response.ok).toBe(true);

    const payload: unknown = await response.json();
    expect(Array.isArray(payload)).toBe(true);

    const variants = createPokemonVariants(payload as BasePokemon[]);
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
  });
});
