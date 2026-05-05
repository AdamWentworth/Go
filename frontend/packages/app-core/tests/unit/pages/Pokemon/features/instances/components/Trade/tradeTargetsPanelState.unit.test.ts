import { describe, expect, it } from 'vitest';

import {
  normalizeListsState,
  normalizeTradeTargetEntries,
  resolveTradeTargetsPanelCopy,
} from '@/pages/Pokemon/features/instances/components/Trade/tradeTargetsPanelState';

describe('tradeTargetsPanelState', () => {
  it('normalizes wanted entries to a record', () => {
    expect(normalizeTradeTargetEntries(null)).toEqual({});
    expect(normalizeTradeTargetEntries(undefined)).toEqual({});
    expect(normalizeTradeTargetEntries('bad')).toEqual({});
    expect(normalizeTradeTargetEntries({ target: true })).toEqual({ target: true });
  });

  it('normalizes list state while preserving non-wanted list data', () => {
    expect(
      normalizeListsState({
        wanted: undefined as unknown as Record<string, unknown>,
        caught: { one: true },
      }),
    ).toEqual({
      wanted: {},
      caught: { one: true },
    });
  });

  it('resolves display copy for target and mirror modes', () => {
    expect(resolveTradeTargetsPanelCopy(false)).toEqual({
      eyebrow: 'Desired Return',
      title: 'Trade Targets',
      description:
        'Choose the Pokemon you would accept for this trade and fine-tune the filters below.',
      listTitle: 'Target List',
    });

    expect(resolveTradeTargetsPanelCopy(true)).toEqual({
      eyebrow: 'Mirror Trade',
      title: 'Mirror Match',
      description: 'Review the mirrored partner that matches this offer.',
      listTitle: 'Available Mirror',
    });
  });
});
