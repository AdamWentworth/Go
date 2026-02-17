import { describe, expect, it } from 'vitest';

import { calculateArcHeight } from '@/pages/Pokemon/features/instances/hooks/useArcHeight';

describe('calculateArcHeight', () => {
  it('computes arc height from panel/header geometry', () => {
    const value = calculateArcHeight({
      panelTopPx: 300,
      baselineLift: 6,
      topGap: 10,
      headerBottomY: 200,
    });

    expect(value).toBe(84);
  });

  it('rounds to nearest integer', () => {
    const value = calculateArcHeight({
      panelTopPx: 300.7,
      baselineLift: 6.2,
      topGap: 9.1,
      headerBottomY: 200.4,
    });

    expect(value).toBe(85);
  });

  it('never returns negative heights', () => {
    const value = calculateArcHeight({
      panelTopPx: 100,
      baselineLift: 20,
      topGap: 25,
      headerBottomY: 150,
    });

    expect(value).toBe(0);
  });
});

