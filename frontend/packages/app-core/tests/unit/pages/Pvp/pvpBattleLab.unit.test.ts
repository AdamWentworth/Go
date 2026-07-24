import { describe, expect, it } from 'vitest';

import {
  buildPvPBattleFighter,
  isPvPBattleCandidateReady,
} from '@/pages/Pvp/utils/pvpBattleLab';
import type { PvPTeamCandidate } from '@/pages/Pvp/utils/pvpTeamBuilder';

const candidate = {
  key: 'caught-1',
  nickname: 'Leaf',
  cp: 1_480,
  entry: {
    speciesId: 'bulbasaur',
    name: 'Bulbasaur',
    types: ['grass', 'poison'],
    variantKind: 'pokemon',
    battleAttack: 91.1,
    battleDefense: 93.3,
    battleHp: 106,
    moveset: [
      {
        id: '1',
        name: 'Vine Whip',
        type: 'grass',
        kind: 'fast',
        power: 5,
        energyGain: 8,
        energyCost: 0,
        turns: 2,
        buff: {
          attackerAttack: 0,
          attackerDefense: 0,
          targetAttack: 0,
          targetDefense: 0,
          chance: 0,
        },
      },
      {
        id: '2',
        name: 'Power Whip',
        type: 'grass',
        kind: 'charged',
        power: 90,
        energyGain: 0,
        energyCost: 50,
        turns: 1,
        buff: {
          attackerAttack: 0,
          attackerDefense: 0,
          targetAttack: 0,
          targetDefense: 0,
          chance: 0,
        },
      },
    ],
  },
} as PvPTeamCandidate;

describe('PvP Battle Lab projections', () => {
  it('builds a simulator fighter from the exact selected copy', () => {
    expect(isPvPBattleCandidateReady(candidate)).toBe(true);
    expect(buildPvPBattleFighter(candidate)).toMatchObject({
      id: 'caught-1',
      name: 'Leaf',
      attack: 91.1,
      defense: 93.3,
      hp: 106,
      shadow: false,
      fastMove: { name: 'Vine Whip', energyGain: 8 },
      chargedMoves: [{ name: 'Power Whip', energyCost: 50 }],
    });
  });

  it('refuses a build whose published move data is incomplete', () => {
    const incomplete = {
      ...candidate,
      entry: {
        ...candidate.entry,
        moveset: candidate.entry.moveset.map((move) => ({
          id: move.id,
          name: move.name,
          type: move.type,
          kind: move.kind,
        })),
      },
    } as PvPTeamCandidate;

    expect(isPvPBattleCandidateReady(incomplete)).toBe(false);
    expect(buildPvPBattleFighter(incomplete)).toBeNull();
  });
});
