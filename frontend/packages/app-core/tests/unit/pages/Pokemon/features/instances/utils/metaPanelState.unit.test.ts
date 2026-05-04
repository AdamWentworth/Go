import { describe, expect, it } from 'vitest';

import {
  hasMetaPanelContent,
  resolveMetaPanelState,
} from '@/pages/Pokemon/features/instances/utils/metaPanelState';

describe('metaPanelState', () => {
  it('normalizes caught and traded summary display values', () => {
    expect(
      resolveMetaPanelState({
        pokemon: {
          instanceData: {
            location_caught: '  Seattle  ',
            date_caught: '2026-02-10T12:00:00.000Z',
            original_trainer_name: ' Misty ',
            traded_date: '2026-02-11T03:12:00.000Z',
          },
        },
        editMode: false,
        isTraded: true,
        originalTrainerName: null,
        tradedDate: null,
        pokeball: 'ultra_ball',
      }),
    ).toMatchObject({
      rawLocation: 'Seattle',
      rawOriginalTrainerName: 'Misty',
      obtainedInTrade: true,
      dateDisplay: '2026-02-10',
      tradedDateDisplay: '2026-02-11',
      tradedDateInputValue: '2026-02-11',
      originalTrainerDisplay: 'Misty',
      hasCaughtSummary: true,
      hasTradeSummary: true,
      showEditFieldsDivider: true,
      showMetaCard: true,
    });
  });

  it('uses explicit trainer and traded date state ahead of stored values', () => {
    expect(
      resolveMetaPanelState({
        pokemon: {
          instanceData: {
            original_trainer_name: 'StoredName',
            traded_date: '2026-01-01',
          },
        },
        editMode: false,
        isTraded: true,
        originalTrainerName: 'CurrentName',
        tradedDate: '2026-03-04T00:00:00.000Z',
        pokeball: null,
      }),
    ).toMatchObject({
      originalTrainerDisplay: 'CurrentName',
      tradedDateDisplay: '2026-03-04',
      hasTradeSummary: true,
    });
  });

  it('hides empty read-only metadata but shows edit mode fields', () => {
    const emptyArgs = {
      pokemon: { instanceData: {} },
      isTraded: false,
      originalTrainerName: null,
      tradedDate: null,
      pokeball: null,
    };

    expect(hasMetaPanelContent({ ...emptyArgs, editMode: false })).toBe(false);
    expect(hasMetaPanelContent({ ...emptyArgs, editMode: true })).toBe(true);
    expect(
      resolveMetaPanelState({ ...emptyArgs, editMode: false }),
    ).toMatchObject({
      hasCaughtSummary: false,
      hasTradeSummary: false,
      showEditFieldsDivider: false,
      showMetaCard: false,
    });
  });

  it('suppresses trade content when trade metadata is disabled', () => {
    expect(
      resolveMetaPanelState({
        pokemon: {
          instanceData: {
            original_trainer_name: 'Brock',
            traded_date: '2026-04-01',
          },
        },
        editMode: false,
        isTraded: true,
        originalTrainerName: null,
        tradedDate: null,
        pokeball: null,
        allowTradeMetadata: false,
      }).showMetaCard,
    ).toBe(false);
  });
});
