import { describe, expect, it } from "vitest";

import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import {
  getUniqueByVariant,
  getVariantBadge,
  isMegaMewtwoY,
  matchesCounterSearch,
  sortRaidMetricScores,
  type SearchableCounterScore,
} from "@/pages/Raid/utils/raidViewModel";

const makeVariant = (
  name: string,
  overrides: Partial<PokemonVariant> = {},
): PokemonVariant =>
  ({
    pokemon_id: 1,
    pokedex_number: 1,
    name,
    species_name: name,
    variant_id: `1-${name}`,
    variantType: "default",
    type_1_id: 10,
    type_2_id: 0,
    type1_name: "grass",
    type2_name: "",
    ...overrides,
  }) as unknown as PokemonVariant;

const makeMove = (name: string, typeName: string): Move =>
  ({
    move_id: 1,
    name,
    type_id: 1,
    type_name: typeName,
    type: typeName,
  }) as Move;

describe("raidViewModel", () => {
  it("sorts metrics without mutating the scoring result", () => {
    const original = [
      {
        variant: makeVariant("Bulbasaur"),
        eDps: 20,
        dps: 21,
        tdo: 400,
        er: 30,
        cp: 2500,
      },
      {
        variant: makeVariant("Ivysaur", { pokemon_id: 2 }),
        eDps: 25,
        dps: 24,
        tdo: 350,
        er: 31,
        cp: 2800,
      },
    ];

    const sorted = sortRaidMetricScores(original, "eDps", "descending");

    expect(sorted.map((score) => score.variant.name)).toEqual([
      "Ivysaur",
      "Bulbasaur",
    ]);
    expect(original.map((score) => score.variant.name)).toEqual([
      "Bulbasaur",
      "Ivysaur",
    ]);
  });

  it("searches names, moves, and normalized Pokemon types", () => {
    const score: SearchableCounterScore = {
      variant: makeVariant("Venusaur", {
        pokemon_id: 3,
        type1_name: undefined as unknown as string,
        type_1_id: 10,
      }),
      fastMove: makeMove("Vine Whip", "grass"),
      chargedMove: makeMove("Sludge Bomb", "poison"),
    };

    expect(matchesCounterSearch(score, "venus")).toBe(true);
    expect(matchesCounterSearch(score, "sludge")).toBe(true);
    expect(matchesCounterSearch(score, "grass")).toBe(true);
    expect(matchesCounterSearch(score, "water")).toBe(false);
  });

  it("deduplicates variants by stable identity while preserving order", () => {
    const bulbasaur = makeVariant("Bulbasaur");
    const duplicate = { ...bulbasaur };
    const ivysaur = makeVariant("Ivysaur", {
      pokemon_id: 2,
      variant_id: "2-default",
    });

    expect(getUniqueByVariant([bulbasaur, duplicate, ivysaur])).toEqual([
      bulbasaur,
      ivysaur,
    ]);
  });

  it("keeps artwork and variant labels deterministic", () => {
    const megaMewtwoY = makeVariant("Mega Mewtwo Y", {
      pokemon_id: 150,
      variantType: "mega",
      megaForm: "Y",
    });

    expect(isMegaMewtwoY(megaMewtwoY)).toBe(true);
    expect(getVariantBadge(megaMewtwoY)).toBe("Mega");
    expect(
      getVariantBadge(
        makeVariant("Shadow Mewtwo", { variantType: "shiny_shadow" }),
      ),
    ).toBe("Shadow");
  });
});
