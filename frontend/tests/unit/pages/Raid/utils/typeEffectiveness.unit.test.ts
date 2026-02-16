import { describe, expect, it } from 'vitest';

import {
  getTypeEffectivenessMultiplier,
  typeEffectivenessMultipliers,
} from '@/pages/Raid/utils/typeEffectiveness';

describe('typeEffectiveness', () => {
  it('exports canonical multiplier constants', () => {
    expect(typeEffectivenessMultipliers.superEffective).toBe(1.6);
    expect(typeEffectivenessMultipliers.doubleSuperEffective).toBe(2.56);
    expect(typeEffectivenessMultipliers.notVeryEffective).toBe(0.625);
    expect(typeEffectivenessMultipliers.neutral).toBe(1);
  });

  it('returns neutral multiplier for empty attacking type', () => {
    expect(getTypeEffectivenessMultiplier('', ['grass'])).toBe(1);
    expect(getTypeEffectivenessMultiplier('   ', ['grass'])).toBe(1);
  });

  it('applies single and dual defender multipliers', () => {
    expect(getTypeEffectivenessMultiplier('fire', ['grass'])).toBeCloseTo(1.6);
    expect(getTypeEffectivenessMultiplier('fire', ['grass', 'bug'])).toBeCloseTo(2.56);
  });

  it('is case-insensitive and ignores unknown defender types', () => {
    expect(getTypeEffectivenessMultiplier('FiRe', ['GrAsS'])).toBeCloseTo(1.6);
    expect(getTypeEffectivenessMultiplier('fire', ['unknown', 'grass'])).toBeCloseTo(1.6);
  });

  it('handles immunities from the chart', () => {
    expect(getTypeEffectivenessMultiplier('normal', ['ghost'])).toBeCloseTo(0.244);
    expect(getTypeEffectivenessMultiplier('electric', ['ground'])).toBeCloseTo(0.244);
  });
});
