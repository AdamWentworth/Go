import { describe, expect, it } from 'vitest';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { MaxRankingEntry } from '@/pages/Max/utils/maxBattleModel';
import {
  getMaxBattleBossPreset,
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
  type1_name: 'grass',
  type2_name: 'poison',
} as PokemonVariant;

const fastMove = {
  move_id: 1,
  name: 'Vine Whip',
  is_fast: 1,
  raid_power: 10,
  raid_cooldown: 0.5,
  type_name: 'grass',
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
      maxTrainers: 40,
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
    const result = simulateMaxBattle({ boss, trainerCount: 100, team });

    expect(result.trainerCount).toBe(40);
    expect(result.subgroupCount).toBe(10);
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
