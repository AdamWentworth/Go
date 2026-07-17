import { describe, expect, it } from "vitest";

import {
  calculateRaidAttackerCp,
  getRaidAttackerIvs,
  resolveRaidAttackerLevel,
} from "@/pages/Raid/utils/raidAttackerModel";
import {
  getLegalRaidChargedMoves,
  getLegalRaidFastMoves,
} from "@/pages/Raid/utils/raidCatalog";
import { buildRaidRoster } from "@/pages/Raid/utils/raidRoster";
import { calculateRaidAttackerBattleStats } from "@/pages/Raid/utils/raidTargetModel";
import { scoreBestRaidOverallAttackers } from "@/pages/Raid/utils/raidRankings";
import { cpMultipliers } from "@/pages/Raid/utils/constants";
import type { PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";

const move = (
  moveId: number,
  name: string,
  isFast: 0 | 1,
): Move =>
  ({
    move_id: moveId,
    name,
    is_fast: isFast,
    raid_power: isFast ? 10 : 100,
    raid_energy: isFast ? 10 : -50,
    raid_cooldown: isFast ? 500 : 2500,
    type: "electric",
    type_name: "electric",
  }) as Move;

const baseVariant = (overrides: Partial<PokemonVariant> = {}): PokemonVariant =>
  ({
    pokemon_id: 25,
    pokedex_number: 25,
    name: "Pikachu",
    species_name: "Pikachu",
    variant_id: "pikachu-default",
    variantType: "default",
    currentImage: "/pikachu.png",
    attack: 112,
    defense: 96,
    stamina: 111,
    type1_name: "electric",
    type2_name: "none",
    moves: [
      move(1, "Thunder Shock", 1),
      move(2, "Quick Attack", 1),
      move(3, "Wild Charge", 0),
      move(4, "Thunderbolt", 0),
    ],
    ...overrides,
  }) as PokemonVariant;

const instance = (
  overrides: Partial<PokemonInstance> = {},
): PokemonInstance =>
  ({
    variant_id: "pikachu-default",
    pokemon_id: 25,
    is_caught: true,
    disabled: false,
    cp: 938,
    level: 40,
    attack_iv: 15,
    defense_iv: 14,
    stamina_iv: 13,
    fast_move_id: 1,
    charged_move1_id: 3,
    charged_move2_id: null,
    ...overrides,
  }) as PokemonInstance;

describe("personalized raid roster", () => {
  it("keeps caught copies distinct and excludes non-caught or disabled records", () => {
    const summary = buildRaidRoster([baseVariant()], {
      first: instance({ instance_id: "first" }),
      second: instance({ instance_id: "second", cp: 900 }),
      wanted: instance({ instance_id: "wanted", is_caught: false }),
      disabled: instance({ instance_id: "disabled", disabled: true }),
    });

    expect(summary.caughtCount).toBe(2);
    expect(summary.eligibleCount).toBe(2);
    expect(summary.attackers.map((attacker) => attacker.variant_id)).toEqual([
      "pikachu-default::caught::first",
      "pikachu-default::caught::second",
    ]);
  });

  it("uses recorded moves and preserves both recorded Charged Attacks", () => {
    const summary = buildRaidRoster([baseVariant()], {
      pikachu: instance({
        fast_move_id: 2,
        charged_move1_id: 4,
        charged_move2_id: 3,
      }),
    });
    const [attacker] = summary.attackers;

    expect(attacker.raidRoster?.moveSource).toBe("recorded");
    expect(getLegalRaidFastMoves(attacker).map((entry) => entry.name)).toEqual([
      "Quick Attack",
    ]);
    expect(
      getLegalRaidChargedMoves(attacker).map((entry) => entry.name),
    ).toEqual(["Wild Charge", "Thunderbolt"]);
  });

  it("omits caught entries whose current moves are incomplete", () => {
    const summary = buildRaidRoster([baseVariant()], {
      pikachu: instance({ fast_move_id: null, charged_move1_id: null }),
    });

    expect(summary.incompleteMoveCount).toBe(1);
    expect(summary.incompleteEntryCount).toBe(1);
    expect(summary.attackers).toHaveLength(0);
  });

  it("allows cosmetic and Max catches to participate as real owned attackers", () => {
    const shinyMax = baseVariant({
      variant_id: "pikachu-shiny-dynamax",
      variantType: "shiny_dynamax",
    });
    const summary = buildRaidRoster([shinyMax], {
      pikachu: instance({ variant_id: shinyMax.variant_id }),
    });

    expect(summary.eligibleCount).toBe(1);
  });

  it("uses recorded level, IVs, and CP instead of the catalog benchmark", () => {
    const [attacker] = buildRaidRoster([baseVariant()], {
      pikachu: instance({
        cp: 777,
        level: 35,
        attack_iv: 10,
        defense_iv: 11,
        stamina_iv: 12,
      }),
    }).attackers;
    const settings = {
      attackerLevel: "50.0",
      friendship: "none",
      megaAllyBonus: "none",
      partyPower: "none",
      dodgeStrategy: "none",
      weatherBoostedType: "",
      shadowBossMode: "normal",
      bossMovesetMode: "expected",
      relobbySeconds: 10,
    } as const;
    const stats = calculateRaidAttackerBattleStats(attacker, settings);

    expect(resolveRaidAttackerLevel(attacker, "50.0")).toBe("35.0");
    expect(getRaidAttackerIvs(attacker)).toEqual({
      attack: 10,
      defense: 11,
      stamina: 12,
    });
    expect(calculateRaidAttackerCp(attacker, "50.0")).toBe(777);
    expect(stats.attack).toBeCloseTo((112 + 10) * cpMultipliers["35.0"]);
  });

  it("ranks caught copies using their real levels instead of the level 50 benchmark", () => {
    const attackers = buildRaidRoster([baseVariant()], {
      level30: instance({ instance_id: "level-30", cp: null, level: 30 }),
      level40: instance({ instance_id: "level-40", cp: null, level: 40 }),
    }).attackers;
    const settings = {
      attackerLevel: "50.0",
      friendship: "none",
      megaAllyBonus: "none",
      partyPower: "none",
      dodgeStrategy: "none",
      weatherBoostedType: "",
      shadowBossMode: "normal",
      bossMovesetMode: "expected",
      relobbySeconds: 10,
    } as const;

    const scores = scoreBestRaidOverallAttackers(attackers, settings, []);

    expect(resolveRaidAttackerLevel(scores[0].variant, "50.0")).toBe("40.0");
    expect(resolveRaidAttackerLevel(scores[1].variant, "50.0")).toBe("30.0");
    expect(scores[0].cp).toBeGreaterThan(scores[1].cp);
    expect(scores[0].dps).toBeGreaterThan(scores[1].dps);
  });

  it("infers a missing level from recorded CP and IVs", () => {
    const catalog = baseVariant();
    const level40Cp = calculateRaidAttackerCp(
      {
        ...catalog,
        instanceData: instance({ cp: null, level: 40 }),
      },
      "40.0",
    );
    const [attacker] = buildRaidRoster([catalog], {
      pikachu: instance({ cp: level40Cp, level: null }),
    }).attackers;

    expect(attacker.raidRoster?.levelSource).toBe("inferred");
    expect(resolveRaidAttackerLevel(attacker, "50.0")).toBe("40.0");
  });

  it("omits caught entries instead of inventing hundo IVs", () => {
    const summary = buildRaidRoster([baseVariant()], {
      pikachu: instance({
        attack_iv: null,
        defense_iv: null,
        stamina_iv: null,
      }),
    });

    expect(summary.incompleteIvCount).toBe(1);
    expect(summary.incompleteEntryCount).toBe(1);
    expect(summary.attackers).toHaveLength(0);
  });

  it("never promotes an incomplete caught attacker to the level 50 benchmark", () => {
    const shadowRegigigas = baseVariant({
      pokemon_id: 486,
      pokedex_number: 486,
      name: "Shadow Regigigas",
      species_name: "Regigigas",
      variant_id: "regigigas-shadow",
      variantType: "shadow",
      attack: 287,
      defense: 210,
      stamina: 221,
    });
    const summary = buildRaidRoster([shadowRegigigas], {
      regigigas: instance({
        variant_id: shadowRegigigas.variant_id,
        pokemon_id: shadowRegigigas.pokemon_id,
        cp: null,
        level: null,
      }),
    });

    expect(summary.incompleteLevelCount).toBe(1);
    expect(summary.attackers).toHaveLength(0);
  });

  it("marks an unknown recorded Hidden Power roll as estimated without replacing the move", () => {
    const hiddenPowerVariant = baseVariant({
      moves: [
        move(10, "Hidden Power", 1),
        move(3, "Wild Charge", 0),
      ],
    });
    const [attacker] = buildRaidRoster([hiddenPowerVariant], {
      pikachu: instance({ fast_move_id: 10 }),
    }).attackers;

    expect(attacker.raidRoster?.moveSource).toBe("recorded");
    expect(attacker.raidRoster?.hiddenPowerTypeEstimated).toBe(true);
    expect(getLegalRaidFastMoves(attacker)).toHaveLength(16);
  });
});
