import { describe, expect, it } from 'vitest';

import { formatCostumeName } from '@/pages/Search/utils/formatCostumeName';

describe('formatCostumeName', () => {
  it('replaces underscores with spaces and capitalizes each word', () => {
    expect(formatCostumeName('party_hat')).toBe('Party Hat');
  });

  it('preserves remaining character casing to match legacy behavior', () => {
    expect(formatCostumeName('PARTY_hat')).toBe('PARTY Hat');
  });

  it('handles single-word costume names', () => {
    expect(formatCostumeName('wizard')).toBe('Wizard');
  });
});
