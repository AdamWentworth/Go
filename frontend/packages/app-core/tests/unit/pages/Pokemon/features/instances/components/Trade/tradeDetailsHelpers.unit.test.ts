import { describe, expect, it } from 'vitest';

import {
  buildWantedOverlayPokemon,
  buildMatchedInstancesPayload,
  countVisibleWantedItems,
  extractBaseKey,
  findAvailableTradeInstances,
  findCaughtInstancesForBaseKey,
  findTradeableInstances,
  initializeSelection,
  prepareTradeCandidateSets,
  resolveTradeProposalDecision,
  toInstanceMap,
  type SelectedPokemon,
} from '@/pages/Pokemon/features/instances/components/Trade/tradeDetailsHelpers';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

const makeInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance =>
  ({
    instance_id: 'inst-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    is_caught: false,
    is_for_trade: false,
    is_wanted: false,
    ...overrides,
  } as PokemonInstance);

const makeVariant = (overrides: Partial<PokemonVariant> = {}): PokemonVariant =>
  ({
    variant_id: '0001-default',
    variantType: 'default',
    currentImage: '/img/default.png',
    species_name: 'Bulbasaur',
    instanceData: {
      instance_id: 'variant-instance',
      pokemon_id: 1,
      is_caught: false,
      is_for_trade: false,
      is_wanted: false,
    } as PokemonInstance,
    ...overrides,
  } as unknown as PokemonVariant);

describe('tradeDetailsHelpers', () => {
  it('initializeSelection maps filter flags to booleans in order', () => {
    const result = initializeSelection(['a', 'b', 'c'], { a: true, c: 1 });
    expect(result).toEqual([true, false, true]);
  });

  it('countVisibleWantedItems excludes local not-wanted entries', () => {
    const result = countVisibleWantedItems(
      { 'k-1': {}, 'k-2': {}, 'k-3': {} },
      { 'k-2': true },
    );
    expect(result).toBe(2);
  });

  it('extractBaseKey strips trailing UUID segment from instance id format', () => {
    expect(extractBaseKey('0001-default_abc-uuid')).toBe('0001-default');
  });

  it('toInstanceMap hashes instances by instance_id', () => {
    const map = toInstanceMap([
      makeInstance({ instance_id: 'a' }),
      makeInstance({ instance_id: 'b', pokemon_id: 2 }),
    ]);

    expect(Object.keys(map)).toEqual(['a', 'b']);
    expect(map.b.pokemon_id).toBe(2);
  });

  it('findCaughtInstancesForBaseKey filters by parsed base key and caught state', () => {
    const instances = [
      makeInstance({ instance_id: '0001-default_uuid-a', is_caught: true }),
      makeInstance({ instance_id: '0001-default_uuid-b', is_caught: false }),
      makeInstance({ instance_id: '0002-default_uuid-c', is_caught: true }),
    ];

    const parse = (input: string) => ({ baseKey: input.split('_')[0] });
    const result = findCaughtInstancesForBaseKey(instances, '0001-default', parse);
    expect(result).toHaveLength(1);
    expect(result[0].instance_id).toBe('0001-default_uuid-a');
  });

  it('findTradeableInstances keeps only trade-eligible caught instances', () => {
    const caughtInstances = [
      makeInstance({ instance_id: 'a', is_for_trade: true }),
      makeInstance({ instance_id: 'b', is_for_trade: false }),
    ];
    const result = findTradeableInstances(caughtInstances);
    expect(result.map((r) => r.instance_id)).toEqual(['a']);
  });

  it('findAvailableTradeInstances excludes instances in pending trades only', () => {
    const tradeableInstances = [
      makeInstance({ instance_id: 'a', is_for_trade: true }),
      makeInstance({ instance_id: 'b', is_for_trade: true }),
      makeInstance({ instance_id: 'c', is_for_trade: true }),
    ];
    const trades = [
      { trade_status: 'pending', pokemon_instance_id_user_proposed: 'a' },
      { trade_status: 'completed', pokemon_instance_id_user_proposed: 'b' },
      { trade_status: 'pending', pokemon_instance_id_user_accepting: 'c' },
    ];

    const result = findAvailableTradeInstances(tradeableInstances, trades);
    expect(result.map((r) => r.instance_id)).toEqual(['b']);
  });

  it('buildMatchedInstancesPayload keeps selected metadata and injects instanceData rows', () => {
    const selectedPokemon: SelectedPokemon = {
      key: '0001-default_abc',
      name: 'Bulbasaur',
      variantType: 'default',
      instanceData: { instance_id: 'existing' },
    };
    const availableInstances = [makeInstance({ instance_id: 'trade-1' })];

    const payload = buildMatchedInstancesPayload(selectedPokemon, availableInstances);

    expect(payload.matchedInstances).toHaveLength(1);
    expect(payload.matchedInstances[0].name).toBe('Bulbasaur');
    expect(payload.matchedInstances[0].instanceData).toEqual(
      expect.objectContaining({ instance_id: 'trade-1' }),
    );
  });

  it('buildWantedOverlayPokemon returns variantNotFound when variant lookup misses', () => {
    const result = buildWantedOverlayPokemon(
      '0001-default_uuid-a',
      [makeVariant({ variant_id: '0002-default' })],
      { '0001-default_uuid-a': makeInstance({ instance_id: '0001-default_uuid-a' }) },
    );

    expect(result).toEqual({
      ok: false,
      error: 'variantNotFound',
      baseKey: '0001-default',
    });
  });

  it('buildWantedOverlayPokemon returns instanceNotFound when instance map misses key', () => {
    const result = buildWantedOverlayPokemon('0001-default_uuid-a', [makeVariant()], {});

    expect(result).toEqual({
      ok: false,
      error: 'instanceNotFound',
      baseKey: '0001-default',
    });
  });

  it('buildWantedOverlayPokemon merges variant and instance payloads for overlay', () => {
    const result = buildWantedOverlayPokemon(
      '0001-default_uuid-a',
      [makeVariant({ variant_id: '0001-default' })],
      {
        '0001-default_uuid-a': makeInstance({
          instance_id: '0001-default_uuid-a',
          pokemon_id: 25,
          is_caught: true,
        }),
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pokemon.variant_id).toBe('0001-default');
      expect(result.pokemon.instanceData).toEqual(
        expect.objectContaining({
          instance_id: '0001-default_uuid-a',
          pokemon_id: 25,
          is_caught: true,
        }),
      );
    }
  });

  it('prepareTradeCandidateSets computes base key, instance map, caught and tradeable sets', () => {
    const selectedPokemon: SelectedPokemon = { key: '0001-default_user-click' };
    const userInstances = [
      makeInstance({ instance_id: '0001-default_uuid-a', is_caught: true, is_for_trade: true }),
      makeInstance({ instance_id: '0001-default_uuid-b', is_caught: true, is_for_trade: false }),
      makeInstance({ instance_id: '0002-default_uuid-c', is_caught: true, is_for_trade: true }),
    ];
    const parse = (input: string) => ({ baseKey: input.split('_')[0] });

    const result = prepareTradeCandidateSets(selectedPokemon, userInstances, parse);

    expect(result.selectedBaseKey).toBe('0001-default');
    expect(Object.keys(result.hashedInstances)).toEqual([
      '0001-default_uuid-a',
      '0001-default_uuid-b',
      '0002-default_uuid-c',
    ]);
    expect(result.caughtInstances.map((item) => item.instance_id)).toEqual([
      '0001-default_uuid-a',
      '0001-default_uuid-b',
    ]);
    expect(result.tradeableInstances.map((item) => item.instance_id)).toEqual(['0001-default_uuid-a']);
  });

  it('resolveTradeProposalDecision returns noCaught when user has no caught instances', () => {
    const decision = resolveTradeProposalDecision(
      { key: '0001-default_user-click' },
      '0001-default',
      [],
      [],
      [],
    );
    expect(decision).toEqual({ kind: 'noCaught' });
  });

  it('resolveTradeProposalDecision returns needsTradeSelection when nothing is flagged for trade', () => {
    const caught = [makeInstance({ instance_id: '0001-default_uuid-a', is_caught: true })];
    const decision = resolveTradeProposalDecision(
      { key: '0001-default_user-click' },
      '0001-default',
      caught,
      [],
      [],
    );

    expect(decision).toEqual({
      kind: 'needsTradeSelection',
      selectedBaseKey: '0001-default',
      caughtInstances: caught,
    });
  });

  it('resolveTradeProposalDecision handles pending-trade exclusion and proposal-ready payload', () => {
    const selected: SelectedPokemon = {
      key: '0001-default_user-click',
      name: 'Bulbasaur',
    };
    const caught = [
      makeInstance({ instance_id: '0001-default_uuid-a', is_caught: true, is_for_trade: true }),
      makeInstance({ instance_id: '0001-default_uuid-b', is_caught: true, is_for_trade: true }),
    ];

    const noAvailableDecision = resolveTradeProposalDecision(
      selected,
      '0001-default',
      caught,
      caught,
      [{ trade_status: 'pending', pokemon_instance_id_user_proposed: '0001-default_uuid-a' }, { trade_status: 'pending', pokemon_instance_id_user_accepting: '0001-default_uuid-b' }],
    );
    expect(noAvailableDecision).toEqual({ kind: 'noAvailableTradeable' });

    const proposalReadyDecision = resolveTradeProposalDecision(
      selected,
      '0001-default',
      caught,
      caught,
      [{ trade_status: 'pending', pokemon_instance_id_user_proposed: 'other' }],
    );

    expect(proposalReadyDecision.kind).toBe('proposalReady');
    if (proposalReadyDecision.kind === 'proposalReady') {
      expect(proposalReadyDecision.payload).toEqual(
        expect.objectContaining({
          matchedInstances: expect.arrayContaining([
            expect.objectContaining({
              name: 'Bulbasaur',
              instanceData: expect.objectContaining({ instance_id: '0001-default_uuid-a' }),
            }),
          ]),
        }),
      );
    }
  });
});
