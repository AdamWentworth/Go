import type { PokemonPvPLeagueKey } from '@shared-contracts/pokemon';

import { calculateCP } from '@/utils/calculateCP';
import { cpMultipliers } from '@/utils/constants';

export type PvPIvBaseStats = {
  attack: number;
  defense: number;
  stamina: number;
};

export type PvPIvValues = {
  attack: number;
  defense: number;
  stamina: number;
};

export type PvPIvRankedSpread = PvPIvValues & {
  rank: number;
  level: number;
  cp: number;
  battleAttack: number;
  battleDefense: number;
  battleHp: number;
  statProduct: number;
  statProductPercent: number;
};

export type PvPIvRankResult = {
  selected: PvPIvRankedSpread;
  best: PvPIvRankedSpread;
  nearby: PvPIvRankedSpread[];
  total: number;
};

const LEAGUE_CP_CAPS: Record<PokemonPvPLeagueKey, number | null> = {
  great: 1_500,
  ultra: 2_500,
  master: null,
};

const IV_VALUES = Array.from({ length: 16 }, (_, value) => value);

const levelsThrough = (maxLevel: 50 | 51): Array<{
  level: number;
  multiplier: number;
}> =>
  Object.entries(cpMultipliers)
    .map(([level, multiplier]) => ({
      level: Number(level),
      multiplier: Number(multiplier),
    }))
    .filter(({ level, multiplier }) => (
      level <= maxLevel &&
      Number.isFinite(level) &&
      Number.isFinite(multiplier)
    ))
    .sort((left, right) => right.level - left.level);

const clampIv = (value: number): number =>
  Math.max(0, Math.min(15, Math.round(Number(value) || 0)));

const spreadKey = ({ attack, defense, stamina }: PvPIvValues): string =>
  `${clampIv(attack)}/${clampIv(defense)}/${clampIv(stamina)}`;

const legalBuild = (
  baseStats: PvPIvBaseStats,
  ivs: PvPIvValues,
  league: PokemonPvPLeagueKey,
  maxLevel: 50 | 51,
): Omit<PvPIvRankedSpread, 'rank' | 'statProductPercent'> => {
  const cpCap = LEAGUE_CP_CAPS[league];
  const levels = levelsThrough(maxLevel);
  const selectedLevel = levels.find(({ multiplier }) => (
    cpCap === null ||
    Math.max(
      10,
      calculateCP(
        baseStats.attack,
        baseStats.defense,
        baseStats.stamina,
        ivs.attack,
        ivs.defense,
        ivs.stamina,
        multiplier,
      ),
    ) <= cpCap
  )) ?? levels[levels.length - 1];

  const battleAttack =
    (baseStats.attack + ivs.attack) * selectedLevel.multiplier;
  const battleDefense =
    (baseStats.defense + ivs.defense) * selectedLevel.multiplier;
  const battleHp = Math.max(
    10,
    Math.floor((baseStats.stamina + ivs.stamina) * selectedLevel.multiplier),
  );
  const cp = Math.max(
    10,
    calculateCP(
      baseStats.attack,
      baseStats.defense,
      baseStats.stamina,
      ivs.attack,
      ivs.defense,
      ivs.stamina,
      selectedLevel.multiplier,
    ),
  );

  return {
    ...ivs,
    level: selectedLevel.level,
    cp,
    battleAttack,
    battleDefense,
    battleHp,
    statProduct: battleAttack * battleDefense * battleHp,
  };
};

export const buildPvPIvRankings = (
  baseStats: PvPIvBaseStats,
  league: PokemonPvPLeagueKey,
  maxLevel: 50 | 51 = 50,
): PvPIvRankedSpread[] => {
  const spreads: Array<Omit<PvPIvRankedSpread, 'rank' | 'statProductPercent'>> = [];

  for (const attack of IV_VALUES) {
    for (const defense of IV_VALUES) {
      for (const stamina of IV_VALUES) {
        spreads.push(legalBuild(
          baseStats,
          { attack, defense, stamina },
          league,
          maxLevel,
        ));
      }
    }
  }

  spreads.sort((left, right) => (
    right.statProduct - left.statProduct ||
    (right.attack + right.defense + right.stamina) -
      (left.attack + left.defense + left.stamina) ||
    right.attack - left.attack ||
    right.defense - left.defense ||
    right.stamina - left.stamina
  ));

  const bestStatProduct = spreads[0]?.statProduct ?? 1;
  return spreads.map((spread, index) => ({
    ...spread,
    rank: index + 1,
    statProductPercent: (spread.statProduct / bestStatProduct) * 100,
  }));
};

export const rankPvPIvSpread = (
  rankings: PvPIvRankedSpread[],
  ivs: PvPIvValues,
  nearbyRadius = 2,
): PvPIvRankResult | null => {
  if (rankings.length === 0) return null;

  const selectedIndex = rankings.findIndex(
    (spread) => spreadKey(spread) === spreadKey(ivs),
  );
  if (selectedIndex < 0) return null;

  return {
    selected: rankings[selectedIndex],
    best: rankings[0],
    nearby: rankings.slice(
      Math.max(0, selectedIndex - nearbyRadius),
      Math.min(rankings.length, selectedIndex + nearbyRadius + 1),
    ),
    total: rankings.length,
  };
};

