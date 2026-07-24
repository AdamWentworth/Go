import { describe, expect, it } from 'vitest';

import {
  analyzePvPTeam,
  rankPvPTeamCandidates,
  type PvPTeamCandidate,
} from '@/pages/Pvp/utils/pvpTeamBuilder';
import type { PokemonPvPRankingEntry } from '@shared-contracts/pokemon';

const candidate = (
  key: string,
  matchups: string[],
  counters: Array<{ speciesId: string; rating: number }>,
  score = 90,
): PvPTeamCandidate => ({
  key,
  entry: {
    rank: 1,
    sourceRank: 1,
    speciesId: key,
    name: key,
    variantKind: 'pokemon',
    imageUrl: `/${key}.png`,
    types: ['normal'],
    moveset: [],
    score,
    rating: 700,
    categoryScores: [],
    matchups: matchups.map((speciesId) => ({ speciesId, rating: 700 })),
    counters,
    moveUsage: [],
    recommendedLevel: 50,
    attackIv: 15,
    defenseIv: 15,
    staminaIv: 15,
  } as PokemonPvPRankingEntry,
});

describe('analyzePvPTeam', () => {
  it('orders default choices by score without mutating the source list', () => {
    const lower = candidate('lower', [], [], 71);
    const highest = candidate('highest', [], [], 96);
    const middle = candidate('middle', [], [], 84);
    const source = [lower, highest, middle];

    expect(rankPvPTeamCandidates(source).map(({ key }) => key)).toEqual([
      'highest',
      'middle',
      'lower',
    ]);
    expect(source.map(({ key }) => key)).toEqual([
      'lower',
      'highest',
      'middle',
    ]);
  });

  it('separates covered and uncovered threats from source matchups', () => {
    const lead = candidate('lead', [], [
      { speciesId: 'threat-a', rating: 280 },
      { speciesId: 'threat-b', rating: 330 },
    ]);
    const closer = candidate('closer', ['threat-a'], [
      { speciesId: 'threat-b', rating: 410 },
    ]);

    const analysis = analyzePvPTeam([lead, closer], [lead, closer]);

    expect(analysis.coveredThreats).toMatchObject([
      { speciesId: 'threat-a', affectedKeys: ['lead'], coveredByKeys: ['closer'] },
    ]);
    expect(analysis.exposedThreats).toMatchObject([
      {
        speciesId: 'threat-b',
        affectedKeys: ['lead', 'closer'],
        coveredByKeys: [],
        worstRating: 330,
      },
    ]);
  });

  it('recommends unselected Pokemon by uncovered threat coverage', () => {
    const member = candidate('member', [], [
      { speciesId: 'threat-a', rating: 300 },
      { speciesId: 'threat-b', rating: 320 },
    ]);
    const broadCover = candidate('broad', ['threat-a', 'threat-b'], [], 80);
    const narrowCover = candidate('narrow', ['threat-a'], [], 99);

    const analysis = analyzePvPTeam(
      [member],
      [member, narrowCover, broadCover],
    );

    expect(analysis.recommendations.map((item) => item.candidate.key)).toEqual([
      'broad',
      'narrow',
    ]);
    expect(analysis.recommendations[0].covers).toEqual(['threat-a', 'threat-b']);
  });
});
