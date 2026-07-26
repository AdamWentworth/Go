import { describe, expect, it } from "vitest";

import {
  buildPokemonCatalogPath,
  readPokemonCatalogFilter,
} from "@/pages/Pokemon/utils/pokemonCatalogNavigation";

describe("pokemonCatalogNavigation", () => {
  it("builds own and public collection links with canonical filters", () => {
    expect(
      buildPokemonCatalogPath({
        filter: "Caught",
      }),
    ).toBe("/pokemon?filter=caught");
    expect(
      buildPokemonCatalogPath({
        username: "Misty Trainer",
        filter: "Favorites",
      }),
    ).toBe("/pokemon/Misty%20Trainer?filter=favorites");
  });

  it.each([
    ["?filter=caught", "Caught"],
    ["?filter=TRADE", "Trade"],
    ["?filter=wAnTeD", "Wanted"],
    ["?filter=favorites", "Favorites"],
  ] as const)("reads %s as %s", (search, expected) => {
    expect(readPokemonCatalogFilter(search)).toBe(expected);
  });

  it("ignores absent and unsupported filters", () => {
    expect(readPokemonCatalogFilter("")).toBeNull();
    expect(readPokemonCatalogFilter("?filter=registered")).toBeNull();
  });
});
