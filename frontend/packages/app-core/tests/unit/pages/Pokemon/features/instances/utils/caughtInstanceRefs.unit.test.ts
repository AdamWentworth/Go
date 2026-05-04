import { describe, expect, it } from 'vitest';

import {
  collectInstanceRefCandidates,
  extractLegacyInstanceId,
  findInstanceByRefs,
  normalizeInstanceToken,
  parseBackgroundId,
} from '@/pages/Pokemon/features/instances/utils/caughtInstanceRefs';
import type { PokemonInstance } from '@/types/pokemonInstance';

describe('caughtInstanceRefs utils', () => {
  it('extracts legacy instance ids from underscore-prefixed keys', () => {
    expect(extractLegacyInstanceId('0025-default_instance-25')).toBe('instance-25');
    expect(extractLegacyInstanceId('instance-25')).toBeNull();
    expect(extractLegacyInstanceId('0025-default_')).toBeNull();
  });

  it('normalizes instance tokens and uuid suffixes', () => {
    const uuid = '79094536-4eec-4736-bcc7-e440d188eee5';

    expect(normalizeInstanceToken(`0025-default_${uuid.toUpperCase()}`)).toBe(uuid);
    expect(normalizeInstanceToken(' Instance-25 ')).toBe('instance-25');
    expect(normalizeInstanceToken('')).toBeNull();
    expect(normalizeInstanceToken(undefined)).toBeNull();
  });

  it('collects full, legacy, and normalized ref candidates', () => {
    expect(collectInstanceRefCandidates('0025-default_Instance-25')).toEqual([
      '0025-default_instance-25',
      'instance-25',
    ]);
  });

  it('finds instances by key aliases and row instance ids', () => {
    const rowByLegacyKey = {
      instance_id: 'row-id-1',
      pokemon_id: 25,
    } as PokemonInstance;
    const rowByInstanceId = {
      instance_id: 'target-instance-id',
      pokemon_id: 26,
    } as PokemonInstance;
    const collection = {
      '0025-default_legacy-match': rowByLegacyKey,
      unrelatedKey: rowByInstanceId,
    };

    expect(findInstanceByRefs(collection, ['legacy-match'])).toBe(rowByLegacyKey);
    expect(findInstanceByRefs(collection, ['target-instance-id'])).toBe(rowByInstanceId);
    expect(findInstanceByRefs(collection, ['missing'])).toBeNull();
    expect(findInstanceByRefs(null, ['target-instance-id'])).toBeNull();
  });

  it('parses numeric background ids from numbers and strings', () => {
    expect(parseBackgroundId(7)).toBe(7);
    expect(parseBackgroundId('7')).toBe(7);
    expect(parseBackgroundId('7-location')).toBe(7);
    expect(parseBackgroundId('')).toBeNull();
    expect(parseBackgroundId(Number.NaN)).toBeNull();
    expect(parseBackgroundId(null)).toBeNull();
  });
});
