import { describe, expect, it } from 'vitest';

import { shouldUpdateTradeInstances } from '@/pages/Pokemon/features/instances/components/Trade/shouldUpdateTradeInstances';

describe('shouldUpdateTradeInstances', () => {
  it('returns false for nullish and non-array values', () => {
    expect(shouldUpdateTradeInstances(null)).toBe(false);
    expect(shouldUpdateTradeInstances(undefined)).toBe(false);
    expect(shouldUpdateTradeInstances('instance-1')).toBe(false);
    expect(shouldUpdateTradeInstances({})).toBe(false);
  });

  it('returns false for empty arrays', () => {
    expect(shouldUpdateTradeInstances([])).toBe(false);
  });

  it('returns true for non-empty arrays to preserve existing behavior', () => {
    expect(shouldUpdateTradeInstances(['instance-1'])).toBe(true);
    expect(shouldUpdateTradeInstances([123])).toBe(true);
  });
});

