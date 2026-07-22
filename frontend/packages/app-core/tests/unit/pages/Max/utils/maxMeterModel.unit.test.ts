import { describe, expect, it } from 'vitest';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { MaxRankingEntry } from '@/pages/Max/utils/maxBattleModel';
import {
  getMaxMeterEnergyForHit,
  selectMaxMeterPlan,
} from '@/pages/Max/utils/maxMeterModel';

const move = (
  moveId: number,
  name: string,
  fast: boolean,
  power: number,
  energy: number,
  cooldown: number,
): Move =>
  ({
    move_id: moveId,
    name,
    is_fast: fast ? 1 : 0,
    raid_power: power,
    raid_energy: energy,
    raid_cooldown: cooldown,
    type_name: 'grass',
    type: 'grass',
  }) as Move;

const fastMove = move(1, 'Vine Whip', true, 10, 10, 0.5);
const chargedMove = move(2, 'Power Whip', false, 100, -50, 2);

const boss = {
  pokemon_id: 3,
  pokedex_number: 3,
  variant_id: '3-dynamax',
  variantType: 'dynamax',
  name: 'Dynamax Venusaur',
  species_name: 'Venusaur',
  attack: 198,
  defense: 189,
  stamina: 190,
  type1_name: 'water',
  type2_name: '',
} as PokemonVariant;

const entry = (moves: Move[] = [fastMove, chargedMove]): MaxRankingEntry =>
  ({
    variant: {
      pokemon_id: 1,
      pokedex_number: 1,
      variant_id: '1-dynamax',
      variantType: 'dynamax',
      name: 'Dynamax Bulbasaur',
      species_name: 'Bulbasaur',
      attack: 118,
      defense: 111,
      stamina: 128,
      type1_name: 'grass',
      type2_name: 'poison',
      moves,
    },
    displayName: 'Dynamax Bulbasaur',
    maxForm: 'dynamax',
    role: 'tank',
    score: 1,
    fastMove,
    chargedMove,
    maxMoveName: 'Max Overgrowth',
    maxMoveType: 'grass',
    maxMovePower: 350,
    maxAttackLevel: 3,
    maxGuardLevel: 3,
    maxSpiritLevel: 3,
    maxGuardHp: 60,
    maxSpiritRate: 0.16,
    attack: 112,
    defense: 105,
    hp: 120,
    cp: 1_200,
    levelLabel: '50',
    ivPercent: 100,
    personalized: false,
    meterSeconds: 0.5,
    fastHitDamage: 7,
    attackIndex: 1,
    neutralBulk: 1,
    effectiveBulk: 1,
    cycleEndurance: 1,
    healPerAlly: 19,
    teamHeal: 76,
    incomingMultiplier: 1,
    outgoingMultiplier: 1,
  }) as MaxRankingEntry;

describe('Max Meter model', () => {
  it('keeps whole-energy breakpoints for one-to-three-star battles', () => {
    expect(
      getMaxMeterEnergyForHit({ damage: 9.9, bossHp: 1_000, tier: 'one-star' }),
    ).toBe(1);
    expect(
      getMaxMeterEnergyForHit({ damage: 10, bossHp: 1_000, tier: 'three-star' }),
    ).toBe(2);
  });

  it('uses fractional energy for Legendary and Gigantamax battles', () => {
    expect(
      getMaxMeterEnergyForHit({
        damage: 173.25,
        bossHp: 17_500,
        tier: 'legendary',
      }),
    ).toBeCloseTo(3.96, 5);
    expect(
      getMaxMeterEnergyForHit({
        damage: 59.4,
        bossHp: 90_000,
        tier: 'gigantamax',
      }),
    ).toBeCloseTo(2, 5);
  });

  it('uses a charged rotation when it improves the complete Max cycle', () => {
    const plan = selectMaxMeterPlan({
      boss,
      bossHp: 1_700,
      entry: entry(),
      maxPhaseDamage: 350,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 1,
      tier: 'one-star',
    });

    expect(plan.strategy).toBe('fast-and-charged');
    expect(plan.chargedMove?.name).toBe('Power Whip');
    expect(plan.chargedUses).toBeGreaterThan(0);
  });

  it('keeps fast-only play when a slow charged move weakens the cycle', () => {
    const slowMove = move(3, 'Slow Beam', false, 20, -100, 5);
    const plan = selectMaxMeterPlan({
      boss,
      bossHp: 90_000,
      entry: entry([fastMove, slowMove]),
      maxPhaseDamage: 1_350,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 4,
      tier: 'gigantamax',
    });

    expect(plan.strategy).toBe('fast-only');
    expect(plan.chargedMove).toBeNull();
    expect(plan.chargedUses).toBe(0);
  });

  it('ignores charged moves that are unusable in raids', () => {
    const unusable = move(4, 'Status Move', false, 0, -50, 2);
    const plan = selectMaxMeterPlan({
      boss,
      bossHp: 1_700,
      entry: entry([fastMove, unusable]),
      maxPhaseDamage: 350,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 1,
      tier: 'one-star',
    });

    expect(plan.strategy).toBe('fast-only');
    expect(plan.chargedMove).toBeNull();
  });

  it('does not credit a shared meter orb before its 15-second spawn', () => {
    const withOrbs = selectMaxMeterPlan({
      boss,
      bossHp: 1_700,
      entry: entry([fastMove]),
      maxPhaseDamage: 1_400,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 4,
      tier: 'one-star',
    });
    const withoutOrbs = selectMaxMeterPlan({
      boss,
      bossHp: 1_700,
      collectMeterOrbs: false,
      entry: entry([fastMove]),
      maxPhaseDamage: 1_400,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 4,
      tier: 'one-star',
    });

    expect(withOrbs.meterSeconds).toBeLessThan(15);
    expect(withOrbs.orbsCollected).toBe(0);
    expect(withOrbs.meterSeconds).toBe(withoutOrbs.meterSeconds);
  });

  it('collects one shared orb at each elapsed spawn interval', () => {
    const withOrbs = selectMaxMeterPlan({
      boss,
      bossHp: 90_000,
      entry: entry([fastMove]),
      maxPhaseDamage: 1_350,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 1,
      tier: 'gigantamax',
    });
    const withoutOrbs = selectMaxMeterPlan({
      boss,
      bossHp: 90_000,
      collectMeterOrbs: false,
      entry: entry([fastMove]),
      maxPhaseDamage: 1_350,
      maxPhaseSeconds: 10,
      meterOrbEnergy: 10,
      subgroupSize: 1,
      tier: 'gigantamax',
    });

    expect(withOrbs.orbsCollected).toBeGreaterThan(0);
    expect(withOrbs.orbEnergy).toBe(withOrbs.orbsCollected * 10);
    expect(withOrbs.meterSeconds).toBeLessThan(withoutOrbs.meterSeconds);
    expect(withoutOrbs.orbsCollected).toBe(0);
  });
});
