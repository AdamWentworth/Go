import { describe, expect, it } from 'vitest';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { MaxRankingEntry } from '@/pages/Max/utils/maxBattleModel';
import {
  getDefaultMaxBattleTier,
  getMaxBattleBossPreset,
  getMaxBattleTierOptions,
  simulateMaxBattle,
  type MaxBattleSimulationTeam,
} from '@/pages/Max/utils/maxBattleSimulation';

const boss = {
  pokemon_id: 3,
  pokedex_number: 3,
  variant_id: '3-gigantamax',
  variantType: 'gigantamax',
  name: 'Gigantamax Venusaur',
  species_name: 'Venusaur',
  attack: 198,
  defense: 189,
  stamina: 190,
  type1_name: 'grass',
  type2_name: 'poison',
} as PokemonVariant;

const dynamaxBulbasaur = {
  ...boss,
  pokemon_id: 1,
  pokedex_number: 1,
  variant_id: '1-dynamax',
  variantType: 'dynamax',
  name: 'Dynamax Bulbasaur',
  species_name: 'Bulbasaur',
  evolves_from: [],
  evolves_to: undefined,
  evolutionData: { evolves_to: [2] },
  rarity: 'Common',
} as PokemonVariant;

const profiledBulbasaur = {
  ...dynamaxBulbasaur,
  evolutionData: undefined,
  max_battle_profiles: [
    {
      profile_id: 100001,
      pokemon_id: 1,
      variant_kind: 'dynamax',
      form: null,
      tier: 'one-star',
      label: 'Starter Max',
      kind: 'standard',
      boss_hp: 1_800,
      default_trainers: 1,
      max_trainers: 4,
      battle_seconds: 355,
      enrage_seconds: 350,
      subgroup_size: 4,
      meter_orb_energy: 12,
      starts_at: null,
      ends_at: null,
      is_default: true,
      priority: 100,
      source_name: 'Curated fixture',
      source_url: 'https://example.test/max/bulbasaur',
      notes: 'Catalog-owned profile.',
    },
    {
      profile_id: 100002,
      pokemon_id: 1,
      variant_kind: 'dynamax',
      form: null,
      tier: 'three-star',
      label: 'Promoted Starter Max',
      kind: 'standard',
      boss_hp: 12_000,
      default_trainers: 3,
      max_trainers: 4,
      battle_seconds: 340,
      enrage_seconds: 330,
      subgroup_size: 4,
      meter_orb_energy: 8,
      starts_at: '2026-07-01T00:00:00Z',
      ends_at: '2026-08-01T00:00:00Z',
      is_default: false,
      priority: 200,
      source_name: 'Event fixture',
      source_url: null,
      notes: 'Temporary promoted event.',
    },
  ],
} as PokemonVariant;

const fastMove = {
  move_id: 1,
  name: 'Vine Whip',
  is_fast: 1,
  raid_power: 10,
  raid_energy: 10,
  raid_cooldown: 0.5,
  type_name: 'grass',
  type: 'grass',
} as Move;

const chargedMove = {
  move_id: 2,
  name: 'Psychic',
  is_fast: 0,
  raid_power: 100,
  raid_energy: -50,
  raid_cooldown: 2,
  type_name: 'psychic',
  type: 'psychic',
} as Move;

const entry = (
  role: MaxRankingEntry['role'],
  overrides: Partial<MaxRankingEntry> = {},
): MaxRankingEntry =>
  ({
    variant: {
      ...boss,
      variant_id: `attacker-${role}`,
      name: `${role} pick`,
      currentImage: '/images/pokemon.png',
    },
    displayName: `${role} pick`,
    maxForm: 'dynamax',
    role,
    score: 100,
    fastMove,
    chargedMove: null,
    maxMoveName: 'Max Overgrowth',
    maxMoveType: 'grass',
    maxMovePower: 350,
    maxAttackLevel: 3,
    maxGuardLevel: 3,
    maxSpiritLevel: 3,
    maxGuardHp: 60,
    maxSpiritRate: 0.16,
    attack: 200,
    defense: 180,
    hp: 200,
    cp: 3_000,
    levelLabel: '50',
    ivPercent: 100,
    personalized: false,
    meterSeconds: 0.5,
    fastHitDamage: 10,
    attackIndex: 1,
    neutralBulk: 1,
    effectiveBulk: 1,
    cycleEndurance: 1,
    healPerAlly: 32,
    teamHeal: 128,
    incomingMultiplier: 1,
    outgoingMultiplier: 1.6,
    bossBenchmark: {
      maxHitDamage: 500,
      incomingDamage: 50,
      incomingType: 'mixed',
      incomingDps: 5,
      hostileIncomingDps: 6,
      hitsToFaint: 4,
      guardedHitsToFaint: 6,
      hpAfterHit: 150,
      hpAfterGuardedHit: 210,
      meterCycleSeconds: 12.5,
      meterCycleDamage: 63,
      hpAfterMeterCycle: 137,
      hpAfterGuardedMeterCycle: 197,
      meterCyclesSurvived: 3.2,
      guardedMeterCyclesSurvived: 4.1,
      pressureSource: 'legal-movesets',
    },
    ...overrides,
  }) as MaxRankingEntry;

const team: MaxBattleSimulationTeam = {
  damage: entry('damage'),
  tank: entry('tank'),
  healing: entry('healing'),
};

describe('Max Battle simulator', () => {
  it('uses the Gigantamax lobby and editable HP preset', () => {
    expect(getMaxBattleBossPreset(boss)).toMatchObject({
      kind: 'gigantamax',
      bossHp: 90_000,
      defaultTrainers: 12,
      maxTrainers: 100,
    });

    const result = simulateMaxBattle({
      boss,
      bossHp: 75_000,
      trainerCount: 12,
      team,
    });

    expect(result.bossHp).toBe(75_000);
    expect(result.trainerCount).toBe(12);
    expect(result.subgroupCount).toBe(3);
    expect(result.supportActionsPerGroup).toBe(2);
    expect(result.meterPlan.fastMove.name).toBe('Vine Whip');
  });

  it('makes additional coordinated Trainers improve the clear estimate', () => {
    const solo = simulateMaxBattle({ boss, trainerCount: 1, team });
    const lobby = simulateMaxBattle({ boss, trainerCount: 12, team });

    expect(lobby.lobbyDps).toBeGreaterThan(solo.lobbyDps);
    expect(lobby.estimatedClearSeconds).toBeLessThan(solo.estimatedClearSeconds);
    expect(solo.outcome).toBe('unlikely');
    expect(lobby.outcome).toBe('likely-clear');
  });

  it('clamps the lobby to the current Gigantamax maximum', () => {
    const result = simulateMaxBattle({ boss, trainerCount: 140, team });

    expect(result.trainerCount).toBe(100);
    expect(result.subgroupCount).toBe(25);
  });

  it('models a basic one-star Dynamax boss as a practical solo', () => {
    expect(getMaxBattleBossPreset(dynamaxBulbasaur)).toMatchObject({
      tier: 'one-star',
      bossHp: 1_700,
      defaultTrainers: 1,
    });

    const result = simulateMaxBattle({
      boss: dynamaxBulbasaur,
      trainerCount: 1,
      team: {
        damage: entry('damage', {
          hp: 120,
          bossBenchmark: {
            ...entry('damage').bossBenchmark!,
            maxHitDamage: 180,
          },
        }),
        tank: entry('tank', {
          hp: 140,
          fastHitDamage: 7,
          bossBenchmark: {
            ...entry('tank').bossBenchmark!,
            incomingDps: 2.5,
          },
        }),
        healing: entry('healing', { hp: 120, healPerAlly: 19 }),
      },
    });

    expect(result.trainerCount).toBe(1);
    expect(result.bossHp).toBe(1_700);
    expect(result.outcome).toBe('likely-clear');
  });

  it('feeds the best legal charge rotation into the clear estimate', () => {
    const tank = entry('tank');
    const result = simulateMaxBattle({
      boss: dynamaxBulbasaur,
      trainerCount: 1,
      team: {
        ...team,
        tank: {
          ...tank,
          variant: {
            ...tank.variant,
            moves: [fastMove, chargedMove],
          },
        },
      },
    });

    expect(result.meterPlan.strategy).toBe('fast-and-charged');
    expect(result.meterPlan.chargedMove?.name).toBe('Psychic');
    expect(result.meterPlan.chargedUses).toBeGreaterThan(0);
  });

  it('uses catalog profile mechanics instead of evolutionary inference', () => {
    const afterEvent = new Date('2026-08-02T00:00:00Z');

    expect(getDefaultMaxBattleTier(profiledBulbasaur, afterEvent)).toBe('one-star');
    expect(getMaxBattleTierOptions(profiledBulbasaur)).toEqual([
      'one-star',
      'three-star',
    ]);
    expect(
      getMaxBattleBossPreset(profiledBulbasaur, undefined, afterEvent),
    ).toMatchObject({
      source: 'catalog',
      profileId: 100001,
      tier: 'one-star',
      label: 'Starter Max',
      bossHp: 1_800,
      defaultTrainers: 1,
      maxTrainers: 4,
      battleSeconds: 355,
      enrageSeconds: 350,
      subgroupSize: 4,
      meterOrbEnergy: 12,
      sourceName: 'Curated fixture',
    });
  });

  it('activates and expires date-bounded event profiles', () => {
    const duringEvent = new Date('2026-07-15T00:00:00Z');
    const afterEvent = new Date('2026-08-02T00:00:00Z');

    expect(getDefaultMaxBattleTier(profiledBulbasaur, duringEvent)).toBe(
      'three-star',
    );
    expect(
      getMaxBattleBossPreset(profiledBulbasaur, undefined, duringEvent),
    ).toMatchObject({
      profileId: 100002,
      tier: 'three-star',
      bossHp: 12_000,
      defaultTrainers: 3,
    });
    expect(
      getMaxBattleBossPreset(profiledBulbasaur, undefined, afterEvent),
    ).toMatchObject({ profileId: 100001, tier: 'one-star' });
  });

  it('keeps promoted three-star events meaningfully harder', () => {
    expect(getMaxBattleBossPreset(dynamaxBulbasaur, 'three-star')).toMatchObject({
      tier: 'three-star',
      bossHp: 10_000,
      defaultTrainers: 2,
    });

    const result = simulateMaxBattle({
      boss: dynamaxBulbasaur,
      tier: 'three-star',
      trainerCount: 1,
      team,
    });

    expect(result.outcome).not.toBe('likely-clear');
  });

  it('accounts for locked support moves instead of granting free support', () => {
    const unsupported = simulateMaxBattle({
      boss,
      trainerCount: 4,
      team: {
        damage: team.damage,
        tank: entry('tank', { maxGuardLevel: 0, maxGuardHp: 0 }),
        healing: entry('healing', {
          maxSpiritLevel: 0,
          maxSpiritRate: 0,
          healPerAlly: 0,
          teamHeal: 0,
        }),
      },
    });

    expect(unsupported.supportActionsPerGroup).toBe(0);
  });
});
