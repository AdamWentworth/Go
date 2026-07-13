import { describe, expect, it } from 'vitest';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move } from '@/types/pokemonSubTypes';
import {
  RAID_TIER_PRESETS,
  calculateRaidBossCp,
  calculateRaidMoveDamage,
  estimateRaidGroup,
  isEligibleRaidAttacker,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  isEligibleRaidBoss,
  scoreRaidCounters,
  type RaidCounterSettings,
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
});
