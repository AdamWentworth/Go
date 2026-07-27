import { describe, expect, it } from 'vitest';
import type { Instances } from '@/types/instances';
import {
  buildPersonalRankingStatuses,
  isWantedEligibleVariant,
  matchesPersonalRankingFilter,
} from '@/pages/Rankings/utils/personalRankingStatus';

const instances = {
  caught: {
    instance_id: 'caught',
    variant_id: 'rayquaza-shiny',
    is_caught: true,
    is_for_trade: false,
    is_wanted: false,
    registered: true,
    disabled: false,
  },
  trade: {
    instance_id: 'trade',
    variant_id: 'rayquaza-shiny',
    is_caught: true,
    is_for_trade: true,
    is_wanted: false,
    registered: true,
    disabled: false,
  },
  wanted: {
    instance_id: 'wanted',
    variant_id: 'mewtwo-armored',
    is_caught: false,
    is_for_trade: false,
    is_wanted: true,
    registered: false,
    disabled: false,
  },
} as unknown as Instances;

describe('personal ranking status', () => {
  it('summarizes exact variant ownership without counting trade copies as available', () => {
    const status = buildPersonalRankingStatuses(instances).get('rayquaza-shiny');

    expect(status).toMatchObject({
      caughtCount: 2,
      tradeCount: 1,
      availableCount: 1,
      registered: true,
      wanted: false,
    });
    expect(status?.caughtInstanceIDs).toEqual(['caught', 'trade']);
    expect(status?.tradeInstanceIDs).toEqual(['trade']);
  });

  it('supports personal collection filters and treats absent variants as missing', () => {
    const statuses = buildPersonalRankingStatuses(instances);
    const owned = statuses.get('rayquaza-shiny');
    const wanted = statuses.get('mewtwo-armored');

    expect(matchesPersonalRankingFilter(owned, 'owned')).toBe(true);
    expect(matchesPersonalRankingFilter(owned, 'available')).toBe(true);
    expect(matchesPersonalRankingFilter(owned, 'trade')).toBe(true);
    expect(matchesPersonalRankingFilter(wanted, 'wanted')).toBe(true);
    expect(matchesPersonalRankingFilter(undefined, 'missing')).toBe(true);
    expect(matchesPersonalRankingFilter(wanted, 'owned')).toBe(false);
  });

  it('rejects shadow variants from wanted and trade availability', () => {
    const shadowInstances = {
      shadow: {
        ...instances.caught,
        variant_id: 'raikou-shiny_shadow',
        shadow: true,
        is_wanted: true,
        is_for_trade: false,
      },
    } as unknown as Instances;
    const status =
      buildPersonalRankingStatuses(shadowInstances).get('raikou-shiny_shadow');

    expect(isWantedEligibleVariant('raikou-shiny_shadow')).toBe(false);
    expect(status).toMatchObject({
      caughtCount: 1,
      wanted: false,
      tradeCount: 0,
      availableCount: 0,
    });
  });
});
