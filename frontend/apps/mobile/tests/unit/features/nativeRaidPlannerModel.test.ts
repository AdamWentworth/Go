import type { NativeCombatEntry, NativeRaidBossEntry } from '../../../src/features/tools/nativeBattleModels';
import {
  estimateNativeRaidGroup,
  getNativeRaidTeam,
  resolveNativeRaidTier,
  simulateNativeRaidLobby,
} from '../../../src/features/tools/nativeRaidPlannerModel';

const score = (id: string, pokemonId: number, value: number): NativeCombatEntry => ({
  chargedMove: null,
  cp: 4000,
  dps: value,
  er: value,
  fastMove: null,
  id,
  imageUri: null,
  maxKind: null,
  name: `Attacker ${id}`,
  pokemonId,
  rosterDetail: null,
  score: value,
  sourceInstanceId: null,
  tdo: value * 10,
  types: [],
});

const boss = (tier: string) => ({ boss: { tier, type: tier } }) as NativeRaidBossEntry;

describe('native raid planner model', () => {
  it('maps public raid tier labels to the canonical battle presets', () => {
    expect(resolveNativeRaidTier(boss('one-star'))).toMatchObject({ hp: 600, timeLimitSeconds: 180 });
    expect(resolveNativeRaidTier(boss('shadow legendary'))).toMatchObject({ hp: 15000, key: 'shadow-legendary' });
  });
  it('builds a distinct six-member team before estimating trainers', () => {
    const scores = [score('a-best', 1, 40), score('a-other-moves', 1, 35), score('b', 2, 30)];
    expect(getNativeRaidTeam(scores).map(({ id }) => id)).toEqual(['a-best', 'b']);
    const estimate = estimateNativeRaidGroup(scores, resolveNativeRaidTier(boss('one-star')));
    expect(estimate.teamDps).toBe(35);
    expect(estimate.minimumTrainers).toBe(1);
  });
  it('simulates the selected lobby size without mutating the estimate', () => {
    const tier = resolveNativeRaidTier(boss('legendary'));
    const estimate = estimateNativeRaidGroup([score('a', 1, 40)], tier);
    expect(simulateNativeRaidLobby(estimate, tier, 1).clears).toBe(false);
    expect(simulateNativeRaidLobby(estimate, tier, 2).seconds).toBeLessThan(simulateNativeRaidLobby(estimate, tier, 1).seconds);
  });
});
