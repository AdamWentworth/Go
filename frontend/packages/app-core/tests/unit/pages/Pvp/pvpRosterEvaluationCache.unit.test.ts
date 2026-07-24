import { beforeEach, describe, expect, it } from 'vitest';

import {
  getCachedPvPRosterEvaluation,
  resetPvPRosterEvaluationMemoryCache,
  setCachedPvPRosterEvaluation,
} from '@/pages/Pvp/utils/pvpRosterEvaluationCache';

describe('personal PvP evaluation cache', () => {
  beforeEach(() => {
    resetPvPRosterEvaluationMemoryCache();
  });

  it('restores an evaluation after the in-memory layer is cleared', async () => {
    const key = `test-${crypto.randomUUID()}`;
    const response = {
      mechanics: 'pvpoke-legacy' as const,
      fieldSize: 12,
      results: [{
        fighterId: 'caught-copy',
        score: 88.4,
        categoryScores: [88, 89, 87, 90, 86, 91] as [
          number,
          number,
          number,
          number,
          number,
          number,
        ],
      }],
    };

    await setCachedPvPRosterEvaluation(key, response);
    resetPvPRosterEvaluationMemoryCache();

    await expect(getCachedPvPRosterEvaluation(key)).resolves.toEqual(response);
  });
});
