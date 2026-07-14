import { describe, expect, it } from 'vitest';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move } from '@/types/pokemonSubTypes';
import {
  RAID_TIER_PRESETS,
  calculateRaidBossCp,
  calculateRaidMoveDamage,
  dedupeBestOverallAttackerPerVariant,
  dedupeBestTypeDpsPerVariant,
  estimateRaidGroup,
  isEligibleRaidAttacker,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  isEligibleRaidBoss,
  scoreBestRaidOverallAttackers,
  scoreRaidCounters,
  scoreRaidOverallAttackers,
  scoreRaidTypeDps,
  type RaidCounterSettings,
  type RaidOverallScore,
  type RaidTypeDpsScore,
} from '@/pages/Raid/utils/raidCalculations';

type RaidCalculationVariantOverrides = Omit<Partial<PokemonVariant>, 'moves' | 'raid_boss'> & {
  moves?: Move[];
  raid_boss?: unknown[];
};

const move = (
  name: string,
  type: string,
  isFast: 0 | 1,
  power: number,
  cooldown: number,
  energy: number,
) =>
  ({
    name,
    type,
    type_name: type,
    is_fast: isFast,
    raid_power: power,
    raid_cooldown: cooldown,
    raid_energy: energy,
  }) as unknown as Move;

const pokemon = (overrides: RaidCalculationVariantOverrides = {}): PokemonVariant =>
  ({
    pokemon_id: overrides.pokemon_id ?? 150,
    pokedex_number: overrides.pokedex_number ?? 150,
    name: overrides.name ?? 'Mewtwo',
    species_name: overrides.species_name ?? overrides.name ?? 'Mewtwo',
    attack: overrides.attack ?? 300,
    defense: overrides.defense ?? 182,
    stamina: overrides.stamina ?? 214,
    type_1_id: overrides.type_1_id ?? 15,
    type_2_id: overrides.type_2_id ?? 0,
    type1_name: overrides.type1_name ?? 'psychic',
    type2_name: overrides.type2_name ?? 'none',
    variantType: overrides.variantType ?? 'default',
    currentImage: overrides.currentImage ?? '',
    image_url: overrides.image_url ?? '',
    sprite_url: overrides.sprite_url ?? '',
    moves:
      overrides.moves ??
      [
        move('Confusion', 'psychic', 1, 20, 1600, 15),
        move('Psystrike', 'psychic', 0, 95, 2300, -50),
      ],
    raid_boss: (overrides.raid_boss ?? []) as unknown as PokemonVariant['raid_boss'],
    backgrounds: [],
    variant_id: overrides.variant_id ?? `${overrides.name ?? 'mewtwo'}-default`,
  }) as unknown as PokemonVariant;

const baseSettings: RaidCounterSettings = {
  attackerLevel: '50.0',
  friendship: 'none',
  megaAllyBonus: 'none',
  partyPower: 'none',
  weatherBoostedType: '',
  shadowBossMode: 'normal',
};

describe('raid calculations', () => {
  it('keeps current raid tier durability presets in place', () => {
    expect(RAID_TIER_PRESETS.tier1.bossHp).toBe(600);
    expect(RAID_TIER_PRESETS.tier3.bossHp).toBe(3600);
    expect(RAID_TIER_PRESETS.legendary.bossHp).toBe(15000);
    expect(RAID_TIER_PRESETS.primal.bossHp).toBe(22500);
    expect(RAID_TIER_PRESETS['legendary-mega'].bossHp).toBe(22500);
    expect(RAID_TIER_PRESETS['super-mega'].bossHp).toBe(25000);
  });

  it('calculates raid boss CP from base stats and raid HP', () => {
    expect(calculateRaidBossCp(pokemon(), RAID_TIER_PRESETS.legendary.bossHp)).toBe(54148);
  });

  it('selects one raid category per variant and separates normal from mega rows', () => {
    const raidBossRows = [
      { id: 1, tier: '3', form: 'Normal', name: 'Venusaur' },
      { id: 2, tier: '4', form: 'Normal', name: 'Venusaur' },
      { id: 3, tier: 'mega', form: 'Normal', name: 'Venusaur' },
      { id: 4, tier: '2', form: 'Normal', name: 'Venusaur' },
    ];
    const venusaur = pokemon({
      name: 'Venusaur',
      variant_id: 'venusaur-default',
      pokemon_id: 3,
      pokedex_number: 3,
      raid_boss: raidBossRows,
    });
    const megaVenusaur = pokemon({
      name: 'Mega Venusaur',
      variant_id: 'venusaur-mega',
      pokemon_id: 3,
      pokedex_number: 3,
      variantType: 'mega',
      raid_boss: raidBossRows,
    });
    const shadowVenusaur = pokemon({
      name: 'Shadow Venusaur',
      variant_id: 'venusaur-shadow',
      pokemon_id: 3,
      pokedex_number: 3,
      variantType: 'shadow',
      raid_boss: raidBossRows,
    });

    expect(getRaidTierKeyForVariant(venusaur)).toBe('tier3');
    expect(getPrimaryRaidMetadataForVariant(venusaur)?.tier).toBe('3');
    expect(getRaidTierKeyForVariant(megaVenusaur)).toBe('mega');
    expect(isEligibleRaidBoss(venusaur)).toBe(true);
    expect(isEligibleRaidBoss(megaVenusaur)).toBe(true);
    expect(isEligibleRaidBoss(shadowVenusaur)).toBe(false);
  });

  it('maps Super Mega raid metadata to the Super Mega raid preset', () => {
    const raidBossRows = [{ id: 910999, tier: 'super_mega', form: 'Normal', name: 'Skarmory' }];
    const skarmory = pokemon({
      name: 'Mega Skarmory',
      variant_id: 'skarmory-super-mega',
      pokemon_id: 227,
      pokedex_number: 227,
      variantType: 'mega',
      raid_boss: raidBossRows,
    });

    expect(getRaidTierKeyForVariant(skarmory)).toBe('super-mega');
    expect(getPrimaryRaidMetadataForVariant(skarmory)?.tier).toBe('super_mega');
  });

  it('maps costume raid metadata only to the matching non-shiny costume boss', () => {
    const raidBossRows = [
      {
        id: 920013,
        tier: '1',
        form: 'Normal',
        name: 'Holiday 2023 Pikachu',
        costume_id: 216,
      },
    ];
    const pikachu = pokemon({
      name: 'Pikachu',
      variant_id: 'pikachu-default',
      pokemon_id: 25,
      pokedex_number: 25,
      raid_boss: raidBossRows,
    });
    const holidayPikachu = pokemon({
      name: 'Holiday 2023 Pikachu',
      variant_id: 'pikachu-costume-216',
      pokemon_id: 25,
      pokedex_number: 25,
      variantType: 'costume_216',
      raid_boss: raidBossRows,
    });
    const shinyHolidayPikachu = pokemon({
      name: 'Shiny Holiday 2023 Pikachu',
      variant_id: 'pikachu-costume-216-shiny',
      pokemon_id: 25,
      pokedex_number: 25,
      variantType: 'costume_216_shiny',
      raid_boss: raidBossRows,
    });

    expect(getRaidTierKeyForVariant(pikachu)).toBeNull();
    expect(getRaidTierKeyForVariant(holidayPikachu)).toBe('tier1');
    expect(getPrimaryRaidMetadataForVariant(holidayPikachu)?.costume_id).toBe(216);
    expect(isEligibleRaidBoss(holidayPikachu)).toBe(true);
    expect(isEligibleRaidAttacker(holidayPikachu)).toBe(false);
    expect(isEligibleRaidBoss(shinyHolidayPikachu)).toBe(false);
  });

  it('selects fusion and shadow raid categories only for matching variants', () => {
    const kyuremFusionRows = [
      { id: 900001, tier: 'fusion_5', form: 'Black', name: 'Black Kyurem' },
      { id: 900002, tier: 'fusion_5', form: 'White', name: 'White Kyurem' },
    ];
    const kyurem = pokemon({
      name: 'Kyurem',
      species_name: 'Kyurem',
      variant_id: 'kyurem-default',
      pokemon_id: 646,
      pokedex_number: 646,
      raid_boss: kyuremFusionRows,
    });
    const blackKyurem = pokemon({
      name: 'Black Kyurem',
      species_name: 'Black Kyurem',
      variant_id: 'kyurem-fusion-black',
      pokemon_id: 646,
      pokedex_number: 646,
      variantType: 'fusion_4',
      raid_boss: kyuremFusionRows,
    });
    const palkiaShadowRow = [{ id: 900011, tier: 'shadow_5', form: 'Normal', name: 'Shadow Palkia' }];
    const palkia = pokemon({
      name: 'Palkia',
      variant_id: 'palkia-default',
      pokemon_id: 484,
      pokedex_number: 484,
      raid_boss: palkiaShadowRow,
    });
    const shadowPalkia = pokemon({
      name: 'Shadow Palkia',
      variant_id: 'palkia-shadow',
      pokemon_id: 484,
      pokedex_number: 484,
      variantType: 'shadow',
      raid_boss: palkiaShadowRow,
    });

    expect(isEligibleRaidBoss(kyurem)).toBe(false);
    expect(getRaidTierKeyForVariant(blackKyurem)).toBe('legendary');
    expect(getPrimaryRaidMetadataForVariant(blackKyurem)?.name).toBe('Black Kyurem');
    expect(isEligibleRaidBoss(palkia)).toBe(false);
    expect(getRaidTierKeyForVariant(shadowPalkia)).toBe('shadow-legendary');
    expect(isEligibleRaidBoss(shadowPalkia)).toBe(true);
  });

  it('applies effectiveness, STAB, shadow attacker bonus, and the raid damage +1 floor', () => {
    const boss = pokemon();
    const tyranitar = pokemon({
      name: 'Tyranitar',
      variant_id: 'tyranitar-default',
      attack: 251,
      defense: 207,
      stamina: 225,
      type1_name: 'rock',
      type2_name: 'dark',
      variantType: 'default',
    });
    const shadowTyranitar = pokemon({
      ...tyranitar,
      name: 'Shadow Tyranitar',
      variant_id: 'tyranitar-shadow',
      variantType: 'shadow',
    });
    const darkMove = move('Bite', 'dark', 1, 6, 500, 4);
    const neutralMove = move('Tackle', 'normal', 1, 5, 500, 4);

    const neutralDamage = calculateRaidMoveDamage({
      move: neutralMove,
      attacker: tyranitar,
      attackerAttack: tyranitar.attack,
      bossDefense: boss.defense,
      bossTypes: ['psychic'],
      settings: baseSettings,
      charged: false,
    });
    const superEffectiveDamage = calculateRaidMoveDamage({
      move: darkMove,
      attacker: tyranitar,
      attackerAttack: tyranitar.attack,
      bossDefense: boss.defense,
      bossTypes: ['psychic'],
      settings: baseSettings,
      charged: false,
    });
    const shadowDamage = calculateRaidMoveDamage({
      move: darkMove,
      attacker: shadowTyranitar,
      attackerAttack: shadowTyranitar.attack,
      bossDefense: boss.defense,
      bossTypes: ['psychic'],
      settings: baseSettings,
      charged: false,
    });

    expect(neutralDamage).toBeGreaterThanOrEqual(1);
    expect(superEffectiveDamage).toBeGreaterThan(neutralDamage);
    expect(shadowDamage).toBeGreaterThan(superEffectiveDamage);
  });

  it('models Party Power as a charged-move damage boost', () => {
    const boss = pokemon();
    const attacker = pokemon({
      name: 'Gengar',
      variant_id: 'gengar-default',
      attack: 261,
      defense: 149,
      stamina: 155,
      type1_name: 'ghost',
      type2_name: 'poison',
    });
    const chargedMove = move('Shadow Ball', 'ghost', 0, 100, 3000, -50);

    const withoutPartyPower = calculateRaidMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack: attacker.attack,
      bossDefense: boss.defense,
      bossTypes: ['psychic'],
      settings: baseSettings,
      charged: true,
    });
    const withEveryChargeBoosted = calculateRaidMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack: attacker.attack,
      bossDefense: boss.defense,
      bossTypes: ['psychic'],
      settings: { ...baseSettings, partyPower: 'every' },
      charged: true,
    });

    expect(withEveryChargeBoosted).toBeGreaterThan(withoutPartyPower);
  });

  it('estimates the group size from the best six scored counters', () => {
    const boss = pokemon();
    const counters = [
      pokemon({
        name: 'Tyranitar',
        variant_id: 'tyranitar-default',
        attack: 251,
        defense: 207,
        stamina: 225,
        type1_name: 'rock',
        type2_name: 'dark',
        moves: [
          move('Bite', 'dark', 1, 6, 500, 4),
          move('Brutal Swing', 'dark', 0, 65, 1900, -33),
        ],
      }),
      pokemon({
        name: 'Gengar',
        variant_id: 'gengar-default',
        attack: 261,
        defense: 149,
        stamina: 155,
        type1_name: 'ghost',
        type2_name: 'poison',
        moves: [
          move('Lick', 'ghost', 1, 5, 500, 6),
          move('Shadow Ball', 'ghost', 0, 100, 3000, -50),
        ],
      }),
    ];

    const scores = scoreRaidCounters(counters, boss, RAID_TIER_PRESETS.legendary, baseSettings);
    const estimate = estimateRaidGroup(scores, boss, RAID_TIER_PRESETS.legendary, 'normal');

    expect(scores.length).toBeGreaterThan(0);
    expect(estimate.topTeamDps).toBeGreaterThan(0);
    expect(estimate.minTrainers).toBeGreaterThan(0);
    expect(estimate.comfortableTrainers).toBeGreaterThanOrEqual(estimate.minTrainers);
  });

  it('ranks overall attackers by neutral raid ER without needing a boss matchup', () => {
    const gengar = pokemon({
      name: 'Gengar',
      variant_id: 'gengar-default',
      attack: 261,
      defense: 149,
      stamina: 155,
      type1_name: 'ghost',
      type2_name: 'poison',
      moves: [
        move('Lick', 'ghost', 1, 5, 500, 6),
        move('Shadow Ball', 'ghost', 0, 100, 3000, -50),
      ],
    });
    const blissey = pokemon({
      name: 'Blissey',
      variant_id: 'blissey-default',
      attack: 129,
      defense: 169,
      stamina: 496,
      type1_name: 'normal',
      type2_name: 'none',
      moves: [
        move('Pound', 'normal', 1, 7, 600, 6),
        move('Hyper Beam', 'normal', 0, 150, 3800, -100),
      ],
    });
    const shinyGengar = pokemon({
      name: 'Shiny Gengar',
      variant_id: 'gengar-shiny',
      variantType: 'shiny',
      moves: [
        move('Lick', 'ghost', 1, 5, 500, 6),
        move('Shadow Ball', 'ghost', 0, 100, 3000, -50),
      ],
    });

    const scores = scoreRaidOverallAttackers([gengar, blissey, shinyGengar], baseSettings);
    const scoreNames = scores.map((score) => score.variant.name);
    const gengarScore = scores.find((score) => score.variant.name === 'Gengar');

    expect(scoreNames).toContain('Gengar');
    expect(scoreNames).toContain('Blissey');
    expect(scoreNames).not.toContain('Shiny Gengar');
    expect(gengarScore?.dps).toBeGreaterThan(0);
    expect(gengarScore?.tdo).toBeGreaterThan(0);
    expect(gengarScore?.er).toBeGreaterThan(0);
    expect(scores[0]?.er).toBeGreaterThanOrEqual(scores[1]?.er ?? 0);
  });

  it('dedupes overall attackers by ER instead of raw DPS', () => {
    const baseScore = scoreRaidOverallAttackers(
      [
        pokemon({
          name: 'Raider',
          variant_id: 'raider-default',
          attack: 220,
          defense: 190,
          stamina: 190,
          type1_name: 'electric',
          type2_name: 'none',
          moves: [
            move('Thunder Shock', 'electric', 1, 5, 600, 8),
            move('Wild Charge', 'electric', 0, 90, 2600, -50),
          ],
        }),
      ],
      baseSettings,
    )[0] as RaidOverallScore;
    const highDpsLowEr = {
      ...baseScore,
      dps: 40,
      tdo: 20,
      er: 25,
      fastMove: move('Glass Cannon', 'electric', 1, 8, 500, 6),
    };
    const lowerDpsHigherEr = {
      ...baseScore,
      dps: 30,
      tdo: 900,
      er: 45,
      fastMove: move('Stable Shock', 'electric', 1, 5, 600, 8),
    };

    expect(
      dedupeBestOverallAttackerPerVariant([highDpsLowEr, lowerDpsHigherEr])[0]?.fastMove.name,
    ).toBe('Stable Shock');
  });

  it('keeps Mega Rayquaza above Crowned Shield Zamazenta on broad raid attacker scoring', () => {
    const megaRayquaza = pokemon({
      name: 'Mega Rayquaza',
      variant_id: 'rayquaza-mega',
      attack: 377,
      defense: 210,
      stamina: 227,
      type1_name: 'dragon',
      type2_name: 'flying',
      variantType: 'mega',
      moves: [
        move('Air Slash', 'flying', 1, 14, 1000, 10),
        move('Dragon Tail', 'dragon', 1, 15, 1000, 9),
        move('Dragon Ascent', 'flying', 0, 140, 3500, -50),
      ],
    });
    const crownedShieldZamazenta = pokemon({
      name: 'Zamazenta',
      species_name: 'Zamazenta',
      form: 'Crowned_shield',
      variant_id: 'zamazenta-crowned-shield',
      attack: 250,
      defense: 292,
      stamina: 192,
      type1_name: 'fighting',
      type2_name: 'steel',
      moves: [
        move('Metal Claw', 'steel', 1, 8, 500, 7),
        move('Behemoth Bash', 'steel', 0, 125, 1500, -50),
      ],
    });
    const raidTargets = [
      pokemon({
        name: 'Palkia',
        variant_id: 'target-palkia',
        type1_name: 'dragon',
        type2_name: 'water',
      }),
      pokemon({
        name: 'Rayquaza',
        variant_id: 'target-rayquaza',
        type1_name: 'dragon',
        type2_name: 'flying',
      }),
      pokemon({
        name: 'Giratina',
        variant_id: 'target-giratina',
        type1_name: 'ghost',
        type2_name: 'dragon',
      }),
      pokemon({
        name: 'Terrakion',
        variant_id: 'target-terrakion',
        type1_name: 'rock',
        type2_name: 'fighting',
      }),
      pokemon({
        name: 'Virizion',
        variant_id: 'target-virizion',
        type1_name: 'grass',
        type2_name: 'fighting',
      }),
    ];

    const scores = dedupeBestOverallAttackerPerVariant(
      scoreRaidOverallAttackers(
        [crownedShieldZamazenta, megaRayquaza],
        baseSettings,
        raidTargets,
      ),
    );

    expect(scores[0]?.variant.name).toBe('Mega Rayquaza');
    expect(scores[0]?.fastMove.name).toBe('Dragon Tail');
    expect(scores[0]?.chargedMove.name).toBe('Dragon Ascent');
    expect(scores[0]?.er).toBeGreaterThan(scores[1]?.er ?? 0);
  });

  it('keeps overall attacker scores stable when raid bosses share the same typings', () => {
    const megaRayquaza = pokemon({
      name: 'Mega Rayquaza',
      variant_id: 'rayquaza-mega',
      attack: 377,
      defense: 210,
      stamina: 227,
      type1_name: 'dragon',
      type2_name: 'flying',
      variantType: 'mega',
      moves: [
        move('Dragon Tail', 'dragon', 1, 15, 1000, 9),
        move('Dragon Ascent', 'flying', 0, 140, 3500, -50),
      ],
    });
    const dragonFlyingTarget = pokemon({
      name: 'Rayquaza',
      variant_id: 'target-rayquaza',
      type1_name: 'dragon',
      type2_name: 'flying',
    });
    const duplicateTypeTargets = [
      dragonFlyingTarget,
      pokemon({
        name: 'Mega Rayquaza',
        variant_id: 'target-mega-rayquaza',
        type1_name: 'dragon',
        type2_name: 'flying',
      }),
      pokemon({
        name: 'Salamence',
        variant_id: 'target-salamence',
        type1_name: 'dragon',
        type2_name: 'flying',
      }),
    ];

    const singleTargetScore = scoreRaidOverallAttackers(
      [megaRayquaza],
      baseSettings,
      [dragonFlyingTarget],
    )[0] as RaidOverallScore;
    const duplicateTargetScore = scoreRaidOverallAttackers(
      [megaRayquaza],
      baseSettings,
      duplicateTypeTargets,
    )[0] as RaidOverallScore;

    expect(duplicateTargetScore.dps).toBeCloseTo(singleTargetScore.dps, 6);
    expect(duplicateTargetScore.tdo).toBeCloseTo(singleTargetScore.tdo, 6);
    expect(duplicateTargetScore.er).toBeCloseTo(singleTargetScore.er, 6);
  });

  it('matches full overall scoring when taking the best moveset per variant', () => {
    const attackers = [
      pokemon({
        name: 'Mega Rayquaza',
        variant_id: 'rayquaza-mega',
        attack: 377,
        defense: 210,
        stamina: 227,
        type1_name: 'dragon',
        type2_name: 'flying',
        variantType: 'mega',
        moves: [
          move('Air Slash', 'flying', 1, 14, 1000, 10),
          move('Dragon Tail', 'dragon', 1, 15, 1000, 9),
          move('Outrage', 'dragon', 0, 110, 3900, -50),
          move('Dragon Ascent', 'flying', 0, 140, 3500, -50),
        ],
      }),
      pokemon({
        name: 'Zamazenta',
        variant_id: 'zamazenta-crowned-shield',
        attack: 250,
        defense: 292,
        stamina: 192,
        type1_name: 'fighting',
        type2_name: 'steel',
        moves: [
          move('Metal Claw', 'steel', 1, 8, 500, 7),
          move('Ice Fang', 'ice', 1, 12, 1000, 8),
          move('Behemoth Bash', 'steel', 0, 125, 1500, -50),
        ],
      }),
    ];
    const raidTargets = [
      pokemon({
        name: 'Palkia',
        variant_id: 'target-palkia',
        type1_name: 'dragon',
        type2_name: 'water',
      }),
      pokemon({
        name: 'Terrakion',
        variant_id: 'target-terrakion',
        type1_name: 'rock',
        type2_name: 'fighting',
      }),
    ];

    const fullBest = dedupeBestOverallAttackerPerVariant(
      scoreRaidOverallAttackers(attackers, baseSettings, raidTargets),
    );
    const fastBest = scoreBestRaidOverallAttackers(attackers, baseSettings, raidTargets);

    expect(fastBest.map((score) => score.variant.variant_id)).toEqual(
      fullBest.map((score) => score.variant.variant_id),
    );
    expect(fastBest[0]?.fastMove.name).toBe(fullBest[0]?.fastMove.name);
    expect(fastBest[0]?.chargedMove.name).toBe(fullBest[0]?.chargedMove.name);
    expect(fastBest[0]?.er).toBeCloseTo(fullBest[0]?.er ?? 0, 6);
  });

  it('ranks type DPS when either the fast or charged move matches the selected type', () => {
    const tyranitar = pokemon({
      name: 'Tyranitar',
      variant_id: 'tyranitar-default',
      attack: 251,
      defense: 207,
      stamina: 225,
      type1_name: 'rock',
      type2_name: 'dark',
      moves: [
        move('Bite', 'dark', 1, 6, 500, 4),
        move('Brutal Swing', 'dark', 0, 65, 1900, -33),
      ],
    });
    const absol = pokemon({
      name: 'Absol',
      variant_id: 'absol-default',
      attack: 246,
      defense: 120,
      stamina: 163,
      type1_name: 'dark',
      type2_name: 'none',
      moves: [
        move('Psycho Cut', 'psychic', 1, 5, 600, 8),
        move('Dark Pulse', 'dark', 0, 80, 3000, -50),
      ],
    });
    const mandibuzz = pokemon({
      name: 'Mandibuzz',
      variant_id: 'mandibuzz-default',
      attack: 129,
      defense: 205,
      stamina: 242,
      type1_name: 'dark',
      type2_name: 'flying',
      moves: [
        move('Snarl', 'dark', 1, 12, 1100, 14),
        move('Aerial Ace', 'flying', 0, 55, 2400, -33),
      ],
    });
    const gengar = pokemon({
      name: 'Gengar',
      variant_id: 'gengar-default',
      attack: 261,
      defense: 149,
      stamina: 155,
      type1_name: 'ghost',
      type2_name: 'poison',
      moves: [
        move('Lick', 'ghost', 1, 5, 500, 6),
        move('Shadow Ball', 'ghost', 0, 100, 3000, -50),
      ],
    });
    const shinyTyranitar = pokemon({
      name: 'Shiny Tyranitar',
      variant_id: 'tyranitar-shiny',
      variantType: 'shiny',
      moves: [
        move('Bite', 'dark', 1, 6, 500, 4),
        move('Brutal Swing', 'dark', 0, 65, 1900, -33),
      ],
    });

    const scores = scoreRaidTypeDps(
      [tyranitar, absol, mandibuzz, gengar, shinyTyranitar],
      'dark',
      baseSettings,
    );
    const scoreNames = scores.map((score) => score.variant.name);
    const absolScore = scores.find((score) => score.variant.name === 'Absol');
    const mandibuzzScore = scores.find((score) => score.variant.name === 'Mandibuzz');

    expect(scoreNames).toContain('Tyranitar');
    expect(scoreNames).toContain('Absol');
    expect(scoreNames).toContain('Mandibuzz');
    expect(scoreNames).not.toContain('Gengar');
    expect(scoreNames).not.toContain('Shiny Tyranitar');
    expect(absolScore?.targetEffectiveness).toBe(1.6);
    expect(absolScore?.fastMatchesType).toBe(false);
    expect(absolScore?.chargedMatchesType).toBe(true);
    expect(absolScore?.fastEffectiveness).toBe(1);
    expect(absolScore?.chargedEffectiveness).toBe(1.6);
    expect(absolScore?.tdo).toBeGreaterThan(0);
    expect(absolScore?.er).toBeGreaterThan(0);
    expect(mandibuzzScore?.fastMatchesType).toBe(true);
    expect(mandibuzzScore?.chargedMatchesType).toBe(false);
    expect(mandibuzzScore?.fastEffectiveness).toBe(1.6);
    expect(mandibuzzScore?.chargedEffectiveness).toBe(1);
    expect(
      dedupeBestTypeDpsPerVariant(scores).filter(
        (score) => score.variant.name === 'Tyranitar',
      ),
    ).toHaveLength(1);
  });

  it('does not boost off-type companion moves on theoretical type DPS pages', () => {
    const megaAbsol = pokemon({
      name: 'Mega Absol',
      variant_id: 'absol-mega',
      attack: 314,
      defense: 130,
      stamina: 163,
      type1_name: 'dark',
      type2_name: 'none',
      variantType: 'mega',
      moves: [
        move('Snarl', 'dark', 1, 12, 1100, 14),
        move('Megahorn', 'bug', 0, 110, 2200, -100),
      ],
    });
    const shadowSneasler = pokemon({
      name: 'Shadow Sneasler',
      variant_id: 'sneasler-shadow',
      attack: 259,
      defense: 158,
      stamina: 190,
      type1_name: 'fighting',
      type2_name: 'poison',
      variantType: 'shadow',
      moves: [
        move('Shadow Claw', 'ghost', 1, 9, 700, 6),
        move('X-Scissor', 'bug', 0, 45, 1600, -33),
      ],
    });
    const pheromosa = pokemon({
      name: 'Pheromosa',
      variant_id: 'pheromosa-default',
      attack: 316,
      defense: 85,
      stamina: 174,
      type1_name: 'bug',
      type2_name: 'fighting',
      variantType: 'default',
      moves: [
        move('Bug Bite', 'bug', 1, 5, 500, 6),
        move('Bug Buzz', 'bug', 0, 100, 3700, -50),
      ],
    });

    const scores = scoreRaidTypeDps([megaAbsol, shadowSneasler, pheromosa], 'bug', baseSettings);
    const megaAbsolScore = scores.find((score) => score.variant.name === 'Mega Absol');
    const shadowSneaslerScore = scores.find((score) => score.variant.name === 'Shadow Sneasler');
    const pheromosaScore = scores.find((score) => score.variant.name === 'Pheromosa');

    expect(megaAbsolScore?.fastMatchesType).toBe(false);
    expect(megaAbsolScore?.chargedMatchesType).toBe(true);
    expect(megaAbsolScore?.fastEffectiveness).toBe(1);
    expect(megaAbsolScore?.chargedEffectiveness).toBe(1.6);
    expect(shadowSneaslerScore?.fastMatchesType).toBe(false);
    expect(shadowSneaslerScore?.chargedMatchesType).toBe(true);
    expect(shadowSneaslerScore?.fastEffectiveness).toBe(1);
    expect(shadowSneaslerScore?.chargedEffectiveness).toBe(1.6);
    expect(pheromosaScore?.fastEffectiveness).toBe(1.6);
    expect(pheromosaScore?.chargedEffectiveness).toBe(1.6);
    expect(scores[0]?.variant.name).toBe('Pheromosa');
  });

  it('ranks type pages by selected-type role output instead of total off-type damage', () => {
    const megaAbsol = pokemon({
      name: 'Mega Absol',
      variant_id: 'absol-mega',
      attack: 314,
      defense: 130,
      stamina: 163,
      type1_name: 'dark',
      type2_name: 'none',
      variantType: 'mega',
      moves: [
        move('Snarl', 'dark', 1, 12, 1100, 14),
        move('Megahorn', 'bug', 0, 110, 2200, -100),
      ],
    });
    const vikavolt = pokemon({
      name: 'Vikavolt',
      variant_id: 'vikavolt-default',
      attack: 254,
      defense: 158,
      stamina: 184,
      type1_name: 'bug',
      type2_name: 'electric',
      moves: [
        move('Bug Bite', 'bug', 1, 5, 500, 6),
        move('Fly', 'flying', 0, 80, 1800, -50),
      ],
    });
    const pheromosa = pokemon({
      name: 'Pheromosa',
      variant_id: 'pheromosa-default',
      attack: 316,
      defense: 85,
      stamina: 174,
      type1_name: 'bug',
      type2_name: 'fighting',
      moves: [
        move('Bug Bite', 'bug', 1, 5, 500, 6),
        move('Bug Buzz', 'bug', 0, 100, 3700, -50),
      ],
    });

    const scores = scoreRaidTypeDps([megaAbsol, vikavolt, pheromosa], 'bug', baseSettings);
    const scoreNames = scores.map((score) => score.variant.name);
    const megaAbsolScore = scores.find((score) => score.variant.name === 'Mega Absol');
    const pheromosaScore = scores.find((score) => score.variant.name === 'Pheromosa');

    expect(scoreNames.indexOf('Pheromosa')).toBeLessThan(scoreNames.indexOf('Mega Absol'));
    expect(megaAbsolScore?.totalDps).toBeGreaterThan(megaAbsolScore?.dps ?? 0);
    expect(pheromosaScore?.totalDps).toBeGreaterThan(0);
    expect(pheromosaScore?.dps).toBeGreaterThan(megaAbsolScore?.dps ?? 0);
  });

  it('dedupes type DPS movesets using ER instead of raw DPS', () => {
    const baseScore = scoreRaidTypeDps(
      [
        pokemon({
          name: 'Bugmon',
          variant_id: 'bugmon-default',
          attack: 200,
          defense: 200,
          stamina: 200,
          type1_name: 'bug',
          type2_name: 'none',
          moves: [
            move('Bug Bite', 'bug', 1, 5, 500, 6),
            move('Bug Buzz', 'bug', 0, 100, 3700, -50),
          ],
        }),
      ],
      'bug',
      baseSettings,
    )[0] as RaidTypeDpsScore;
    const highDpsLowEr = {
      ...baseScore,
      dps: 40,
      tdo: 20,
      er: 25,
      fastMove: move('Fast Spike', 'bug', 1, 9, 500, 6),
    };
    const lowerDpsHigherEr = {
      ...baseScore,
      dps: 30,
      tdo: 900,
      er: 45,
      fastMove: move('Sustained Bite', 'bug', 1, 5, 500, 6),
    };

    expect(dedupeBestTypeDpsPerVariant([highDpsLowEr, lowerDpsHigherEr])[0]?.fastMove.name).toBe(
      'Sustained Bite',
    );
  });
});
