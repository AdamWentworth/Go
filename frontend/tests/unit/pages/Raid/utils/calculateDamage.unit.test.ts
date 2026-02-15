import { describe, expect, it } from 'vitest';

import { calculateDamage } from '@/pages/Raid/utils/calculateDamage';

describe('calculateDamage', () => {
  it('computes neutral non-STAB damage', () => {
    const damage = calculateDamage(
      100,
      200,
      200,
      'fire',
      'water',
      '',
      'normal',
      '',
    );

    expect(damage).toBe(50);
  });

  it('applies STAB when move type matches attacker type', () => {
    const withoutStab = calculateDamage(
      100,
      200,
      200,
      'fire',
      'water',
      '',
      'normal',
      '',
    );
    const withStab = calculateDamage(
      100,
      200,
      200,
      'fire',
      'fire',
      '',
      'normal',
      '',
    );

    expect(withoutStab).toBe(50);
    expect(withStab).toBe(60);
  });

  it('applies dual-type effectiveness multipliers', () => {
    const damage = calculateDamage(
      100,
      200,
      200,
      'fire',
      'water',
      '',
      'grass',
      'bug',
    );

    // 0.5 * 100 * 2.56 * 1.0 = 128
    expect(damage).toBe(128);
  });

  it('normalizes type names case-insensitively', () => {
    const mixedCase = calculateDamage(
      100,
      200,
      200,
      'FiRe',
      'fIrE',
      '',
      'GrAsS',
      'BuG',
    );
    const lowerCase = calculateDamage(
      100,
      200,
      200,
      'fire',
      'fire',
      '',
      'grass',
      'bug',
    );

    expect(mixedCase).toBe(lowerCase);
    expect(mixedCase).toBe(154);
  });

  it('preserves legacy empty-move behavior when move type is missing', () => {
    const damage = calculateDamage(
      100,
      200,
      200,
      undefined,
      'fire',
      '',
      'grass',
      'bug',
    );

    // Legacy behavior: empty move type and empty attackerType2 are treated as a STAB match.
    // 0.5 * 100 * 1.0 * 1.2 = 60
    expect(damage).toBe(60);
  });
});
