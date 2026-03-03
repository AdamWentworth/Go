// moveCombinations.ts

import {
  calculateDPS,
  type Variant as DPSVariant,
  type Move as DPSMove,
  type SelectedRaidBoss,
} from './calculateDPS';
import { cpMultipliers } from './constants';

const LEVEL_50_CP_MULTIPLIER = cpMultipliers["50.0"];

export interface Move extends DPSMove {
  is_fast: number;
  name: string;
}

export interface Variant extends DPSVariant {
  attack: number;
  defense: number;
  stamina: number;
  name: string;
  moves: Move[];
}

export interface MoveCombination {
  name: string;
  fastMove: string;
  chargedMove: string;
  dps: number;
  tdo: string;
  er: string;
  cp: string;
}

export function getMoveCombinations(
  variant: Variant,
  raidBossDPS: number,
  raidBossAttack: number,
  raidBossDefense: number,
  raidBossStamina: number,
  selectedRaidBoss: SelectedRaidBoss | null
): MoveCombination[] {
  if (!variant || !variant.moves) {
    return []; // Return an empty array if variant or moves are undefined.
  }

  const fastMoves = variant.moves.filter(move => move.is_fast === 1);
  const chargedMoves = variant.moves.filter(move => move.is_fast === 0);

  const playerAttackStat = Math.floor((variant.attack + 15) * LEVEL_50_CP_MULTIPLIER);
  const playerDefenseStat = Math.floor((variant.defense + 15) * LEVEL_50_CP_MULTIPLIER);
  const playerStaminaStat = Math.floor((variant.stamina + 15) * LEVEL_50_CP_MULTIPLIER);

  const cp = calculateCP(variant.attack + 15, variant.defense + 15, variant.stamina + 15, LEVEL_50_CP_MULTIPLIER);

  return fastMoves.flatMap(fastMove =>
    chargedMoves.map(chargedMove => {
      const dps = calculateDPS(
        variant,
        fastMove,
        chargedMove,
        playerAttackStat,
        playerDefenseStat,
        playerStaminaStat,
        raidBossDPS,
        raidBossAttack,
        raidBossDefense,
        raidBossStamina,
        selectedRaidBoss
      );

      return {
        name: variant.name,
        fastMove: fastMove.name,
        chargedMove: chargedMove.name,
        dps: Number(dps),
        tdo: '---',
        er: '---',
        cp: cp.toString()
      };
    })
  );
}

function calculateCP(attack: number, defense: number, stamina: number, cpMultiplier: number): number {
  return Math.floor((attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplier ** 2) / 10);
}
