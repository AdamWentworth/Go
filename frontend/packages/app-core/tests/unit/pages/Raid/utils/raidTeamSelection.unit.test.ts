import { describe, expect, it } from "vitest";

import {
  selectLegalRaidTeamCounters,
  usesRaidMegaSlot,
} from "@/pages/Raid/utils/raidTeamSelection";
import type { RaidCounterScore } from "@/pages/Raid/utils/raidTypes";
import type { PokemonVariant } from "@/types/pokemonVariants";

const score = ({
  id,
  dps,
  variantType = "default",
  instanceId,
  formSource,
  primal = false,
}: {
  id: string;
  dps: number;
  variantType?: string;
  instanceId?: string;
  formSource?: "base" | "fusion" | "crown" | "mega";
  primal?: boolean;
}): RaidCounterScore =>
  ({
    variant: {
      variant_id: id,
      variantType,
      primal,
      raidRoster: instanceId
        ? {
            source: "caught",
            instanceId,
            moveSource: "recorded",
            levelSource: "recorded",
            ivSource: "recorded",
            formSource,
          }
        : undefined,
    } as PokemonVariant,
    dps,
    soloTimeSeconds: 1000 / dps,
  }) as RaidCounterScore;

describe("legal raid team selection", () => {
  it("allows at most one Mega or Primal in a generated team", () => {
    const team = selectLegalRaidTeamCounters(
      [
        score({ id: "mega-rayquaza", dps: 50, variantType: "mega" }),
        score({ id: "primal-groudon", dps: 48, variantType: "primal" }),
        score({ id: "regular-1", dps: 40 }),
        score({ id: "regular-2", dps: 39 }),
      ],
      3,
    );

    expect(team.map((entry) => entry.variant.variant_id)).toEqual([
      "mega-rayquaza",
      "regular-1",
      "regular-2",
    ]);
    expect(team.filter(usesRaidMegaSlot)).toHaveLength(1);
  });

  it("does not use one caught Pokemon as both its base and Mega form", () => {
    const team = selectLegalRaidTeamCounters(
      [
        score({
          id: "rayquaza-mega",
          dps: 50,
          variantType: "mega",
          instanceId: "rayquaza-1",
          formSource: "mega",
        }),
        score({
          id: "rayquaza-base",
          dps: 49,
          instanceId: "rayquaza-1",
          formSource: "base",
        }),
        score({
          id: "mewtwo-base",
          dps: 40,
          instanceId: "mewtwo-1",
          formSource: "base",
        }),
      ],
      2,
    );

    expect(team.map((entry) => entry.variant.variant_id)).toEqual([
      "rayquaza-mega",
      "mewtwo-base",
    ]);
  });

  it("chooses a stronger no-Mega team when projecting a Mega would displace its base catch", () => {
    const team = selectLegalRaidTeamCounters(
      [
        score({
          id: "base",
          dps: 100,
          instanceId: "same-catch",
          formSource: "base",
        }),
        score({
          id: "mega",
          dps: 51,
          variantType: "mega",
          instanceId: "same-catch",
          formSource: "mega",
        }),
        score({ id: "partner", dps: 99 }),
      ],
      2,
    );

    expect(team.map((entry) => entry.variant.variant_id)).toEqual([
      "base",
      "partner",
    ]);
    expect(team.filter(usesRaidMegaSlot)).toHaveLength(0);
  });
});
