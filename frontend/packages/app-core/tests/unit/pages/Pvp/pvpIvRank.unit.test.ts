import { describe, expect, it } from 'vitest';

import {
  buildPvPIvRankings,
  rankPvPIvSpread,
  summarizePvPIvSpread,
} from '@/pages/Pvp/utils/pvpIvRank';

describe('PvP IV Rank model', () => {
  it('enumerates every appraisal spread and ranks the strongest legal build first', () => {
    const rankings = buildPvPIvRankings(
      { attack: 118, defense: 111, stamina: 128 },
      'great',
    );

    expect(rankings).toHaveLength(4_096);
    expect(rankings[0]).toMatchObject({
      rank: 1,
      attack: 15,
      defense: 15,
      stamina: 15,
      level: 50,
      cp: 1_260,
      statProductPercent: 100,
    });
    expect(rankings.every((spread) => spread.cp <= 1_500)).toBe(true);
  });

  it('finds the known rank-one Azumarill Great League spread', () => {
    const rankings = buildPvPIvRankings(
      { attack: 112, defense: 152, stamina: 225 },
      'great',
    );
    const result = rankPvPIvSpread(rankings, {
      attack: 0,
      defense: 15,
      stamina: 15,
    });

    expect(result?.selected).toMatchObject({
      rank: 1,
      attack: 0,
      defense: 15,
      stamina: 15,
      cp: 1_499,
      level: 45.5,
      statProductPercent: 100,
    });
  });

  it('uses perfect IVs at the level ceiling when the league has no CP cap', () => {
    const rankings = buildPvPIvRankings(
      { attack: 250, defense: 200, stamina: 200 },
      'master',
    );

    expect(rankings[0]).toMatchObject({
      attack: 15,
      defense: 15,
      stamina: 15,
      level: 50,
    });
  });

  it('supports Best Buddy level 51 without changing the number of spreads', () => {
    const standard = buildPvPIvRankings(
      { attack: 118, defense: 111, stamina: 128 },
      'great',
      50,
    );
    const bestBuddy = buildPvPIvRankings(
      { attack: 118, defense: 111, stamina: 128 },
      'great',
      51,
    );

    expect(bestBuddy).toHaveLength(standard.length);
    expect(bestBuddy[0].level).toBe(51);
    expect(bestBuddy[0].statProduct).toBeGreaterThan(standard[0].statProduct);
  });

  it('returns the selected spread with nearby comparison ranks', () => {
    const rankings = buildPvPIvRankings(
      { attack: 118, defense: 111, stamina: 128 },
      'great',
    );
    const result = rankPvPIvSpread(
      rankings,
      { attack: 10, defense: 10, stamina: 10 },
      2,
    );

    expect(result).not.toBeNull();
    expect(result?.selected).toMatchObject({
      attack: 10,
      defense: 10,
      stamina: 10,
    });
    expect(result?.nearby).toHaveLength(5);
    expect(result?.nearby.some(
      (spread) => spread.rank === result.selected.rank,
    )).toBe(true);
  });

  it.each([
    ['great', { attack: 118, defense: 111, stamina: 128 }, { attack: 4, defense: 14, stamina: 15 }],
    ['ultra', { attack: 149, defense: 136, stamina: 163 }, { attack: 1, defense: 15, stamina: 13 }],
    ['master', { attack: 250, defense: 200, stamina: 200 }, { attack: 15, defense: 14, stamina: 15 }],
  ] as const)(
    'summarizes one %s spread identically to the complete ranking table',
    (league, baseStats, ivs) => {
      const rankings = buildPvPIvRankings(baseStats, league);
      const result = rankPvPIvSpread(rankings, ivs);
      const summary = summarizePvPIvSpread(baseStats, ivs, league);

      expect(result).not.toBeNull();
      expect(summary).toEqual({
        rank: result?.selected.rank,
        total: result?.total,
        statProductPercent: result?.selected.statProductPercent,
      });
    },
  );
});
