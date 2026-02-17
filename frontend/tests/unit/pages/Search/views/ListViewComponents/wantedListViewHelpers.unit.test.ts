import { describe, expect, it } from 'vitest';

import {
  formatWantedDate,
  getWantedTradeEntries,
  hasWantedAdditionalDetails,
  toWantedGender,
  type WantedListItem,
} from '@/pages/Search/views/ListViewComponents/wantedListViewHelpers';

describe('wantedListViewHelpers', () => {
  it('formats valid dates and falls back to Unknown', () => {
    expect(formatWantedDate('2026-02-17T12:34:56.000Z')).toBe('2026-02-17');
    expect(formatWantedDate('bad-date')).toBe('Unknown');
    expect(formatWantedDate()).toBe('Unknown');
  });

  it('normalizes allowed gender values and rejects unknown values', () => {
    expect(toWantedGender('Male')).toBe('Male');
    expect(toWantedGender('Female')).toBe('Female');
    expect(toWantedGender('Unknown')).toBeNull();
    expect(toWantedGender(undefined)).toBeNull();
  });

  it('detects additional wanted details', () => {
    const empty: WantedListItem = {};
    expect(hasWantedAdditionalDetails(empty)).toBe(false);

    expect(hasWantedAdditionalDetails({ weight: 12.5 })).toBe(true);
    expect(hasWantedAdditionalDetails({ date_caught: '2026-02-17' })).toBe(true);
    expect(hasWantedAdditionalDetails({ charged_move1_id: 14 })).toBe(true);
  });

  it('returns stable trade-list entries for rendering', () => {
    expect(getWantedTradeEntries(null)).toEqual([]);
    expect(getWantedTradeEntries(undefined)).toEqual([]);

    expect(
      getWantedTradeEntries({
        'variant-1:abc': { match: true },
      }),
    ).toEqual([['variant-1:abc', { match: true }]]);
  });
});
