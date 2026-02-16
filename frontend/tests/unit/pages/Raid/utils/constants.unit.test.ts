import { describe, expect, it } from 'vitest';

import {
  cpMultipliers,
  DEFAULT_RAID_BOSS_STATS,
  TYPE_MAPPING,
} from '@/pages/Raid/utils/constants';

describe('raid constants', () => {
  it('exposes expected CP multiplier checkpoints', () => {
    expect(cpMultipliers['1.0']).toBeCloseTo(0.094);
    expect(cpMultipliers['50.0']).toBeCloseTo(0.84029999);
    expect(cpMultipliers['51.0']).toBeCloseTo(0.84529999);
  });

  it('exposes default raid boss stats', () => {
    expect(DEFAULT_RAID_BOSS_STATS).toEqual({
      dps: 20,
      attack: 200,
      defense: 160,
      stamina: 15000,
    });
  });

  it('maps raid type ids to canonical names', () => {
    expect(TYPE_MAPPING[1].name).toBe('bug');
    expect(TYPE_MAPPING[7].name).toBe('fire');
    expect(TYPE_MAPPING[18].name).toBe('water');
    expect(Object.keys(TYPE_MAPPING)).toHaveLength(18);
  });
});
