import { describe, expect, it } from "vitest";

import {
  canBreakSuperMegaShield,
  getSuperMegaShieldRules,
  RAID_TIER_PRESETS,
} from "@/pages/Raid/utils/raidCalculations";
import type { PokemonVariant } from "@/types/pokemonVariants";

const variant = (overrides: Partial<PokemonVariant> = {}): PokemonVariant =>
  ({
    pokemon_id: 150,
    name: "Mewtwo",
    species_name: "Mewtwo",
    variant_id: "mewtwo-mega-y",
    variantType: "mega_y",
    megaForm: "Y",
    currentImage: "",
    raid_boss: [],
    ...overrides,
  }) as unknown as PokemonVariant;

describe("Super Mega raid rules", () => {
  it("prefers a catalog shield count over the curated fallback", () => {
    const rules = getSuperMegaShieldRules(
      variant({
        raid_boss: [
          {
            id: 1,
            pokemon_id: 150,
            name: "Mega Mewtwo Y",
            form: "Y",
            tier: "super_mega",
            shield_count: 12,
          },
        ] as PokemonVariant["raid_boss"],
      }),
      RAID_TIER_PRESETS["super-mega"],
    );

    expect(rules).toMatchObject({
      shieldCount: 12,
      shieldCountSource: "catalog",
      triggerHpFraction: 0.8,
    });
  });

  it("uses the known boss count and a documented fallback when metadata is absent", () => {
    expect(
      getSuperMegaShieldRules(variant(), RAID_TIER_PRESETS["super-mega"]),
    ).toMatchObject({ shieldCount: 10, shieldCountSource: "curated" });
    expect(
      getSuperMegaShieldRules(
        variant({ pokemon_id: 9999 }),
        RAID_TIER_PRESETS["super-mega"],
      ),
    ).toMatchObject({ shieldCount: 8, shieldCountSource: "fallback" });
  });

  it("uses the released Skarmory and Falinks shield counts", () => {
    expect(
      getSuperMegaShieldRules(
        variant({ pokemon_id: 227 }),
        RAID_TIER_PRESETS["super-mega"],
      ),
    ).toMatchObject({ shieldCount: 7, shieldCountSource: "curated" });
    expect(
      getSuperMegaShieldRules(
        variant({ pokemon_id: 870 }),
        RAID_TIER_PRESETS["super-mega"],
      ),
    ).toMatchObject({ shieldCount: 8, shieldCountSource: "curated" });
  });

  it("allows actual Mega forms but not Primals to break shields", () => {
    expect(canBreakSuperMegaShield(variant())).toBe(true);
    expect(
      canBreakSuperMegaShield(variant({ variantType: "primal", primal: true })),
    ).toBe(false);
  });
});
