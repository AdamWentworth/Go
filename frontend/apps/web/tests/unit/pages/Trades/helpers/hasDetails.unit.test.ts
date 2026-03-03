import { describe, expect, it } from 'vitest';

import { hasDetails } from '@/pages/Trades/helpers/hasDetails';

describe('hasDetails', () => {
  it('returns false for nullish values', () => {
    expect(hasDetails(undefined)).toBe(false);
    expect(hasDetails(null)).toBe(false);
  });

  it('returns true when at least one move id exists', () => {
    expect(hasDetails({ fast_move_id: 1 })).toBe(true);
    expect(hasDetails({ charged_move1_id: 2 })).toBe(true);
    expect(hasDetails({ charged_move2_id: 3 })).toBe(true);
  });

  it('returns true when any IV value is numeric including zero', () => {
    expect(hasDetails({ attack_iv: 0 })).toBe(true);
    expect(hasDetails({ defense_iv: 15 })).toBe(true);
    expect(hasDetails({ stamina_iv: 7 })).toBe(true);
  });

  it('returns true only when weight/height are positive numbers', () => {
    expect(hasDetails({ weight: 0, height: 0 })).toBe(false);
    expect(hasDetails({ weight: -1, height: -1 })).toBe(false);
    expect(hasDetails({ weight: 1.2 })).toBe(true);
    expect(hasDetails({ height: 0.5 })).toBe(true);
  });

  it('returns true when location/date fields are present', () => {
    expect(hasDetails({ location_caught: 'Tokyo' })).toBe(true);
    expect(hasDetails({ date_caught: '2026-02-15' })).toBe(true);
  });
});
