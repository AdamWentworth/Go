import { describe, expect, it } from 'vitest';

import {
  evaluateScrollDecision,
  getAdjustedCollapsePoint,
} from '@/pages/Search/hooks/useSearchBarCollapse';

describe('useSearchBarCollapse helpers', () => {
  it('computes adjusted collapse point using 15% headroom', () => {
    const point = getAdjustedCollapsePoint(100, 200);
    expect(point).toBe(270);
  });

  it('requests collapse when scrollY exceeds collapse point', () => {
    const decision = evaluateScrollDecision({
      scrollY: 271,
      searchBarOffsetTop: 100,
      searchBarHeight: 200,
      searchTriggered: false,
    });

    expect(decision).toBe('collapse');
  });

  it('consumes one top-scroll event after search trigger', () => {
    const decision = evaluateScrollDecision({
      scrollY: 0,
      searchBarOffsetTop: 100,
      searchBarHeight: 200,
      searchTriggered: true,
    });

    expect(decision).toBe('consume_search_trigger');
  });

  it('expands when at top without pending search trigger', () => {
    const decision = evaluateScrollDecision({
      scrollY: 0,
      searchBarOffsetTop: 100,
      searchBarHeight: 200,
      searchTriggered: false,
    });

    expect(decision).toBe('expand');
  });

  it('does nothing on non-top scroll below threshold', () => {
    const decision = evaluateScrollDecision({
      scrollY: 200,
      searchBarOffsetTop: 100,
      searchBarHeight: 200,
      searchTriggered: false,
    });

    expect(decision).toBe('none');
  });
});

