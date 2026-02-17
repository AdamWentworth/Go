import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PokemonInstance } from '@/types/pokemonInstance';
import useTradeProposalFlow from '@/pages/Pokemon/features/instances/components/Trade/useTradeProposalFlow';

const makeInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance =>
  ({
    instance_id: '0001-default_123e4567-e89b-12d3-a456-426614174000',
    variant_id: '0001-default',
    pokemon_id: 1,
    is_caught: true,
    is_for_trade: false,
    is_wanted: false,
    ...overrides,
  } as PokemonInstance);

const makeArgs = () => {
  const alert = vi.fn();
  const closeOverlay = vi.fn();
  const fetchInstances = vi.fn<() => Promise<PokemonInstance[]>>();
  const fetchTrades = vi.fn<() => Promise<unknown[]>>();

  return {
    alert,
    closeOverlay,
    fetchInstances,
    fetchTrades,
  };
};

describe('useTradeProposalFlow', () => {
  it('returns early when no selected pokemon is set', async () => {
    const { alert, closeOverlay, fetchInstances, fetchTrades } = makeArgs();
    const { result } = renderHook(() =>
      useTradeProposalFlow({
        selectedPokemon: null,
        closeOverlay,
        alert,
        fetchInstances,
        fetchTrades,
      }),
    );

    await act(async () => {
      await result.current.proposeTrade();
    });

    expect(fetchInstances).not.toHaveBeenCalled();
    expect(fetchTrades).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    expect(closeOverlay).not.toHaveBeenCalled();
    expect(result.current.isTradeProposalOpen).toBe(false);
  });

  it('alerts when instances cannot be loaded', async () => {
    const { alert, closeOverlay, fetchInstances, fetchTrades } = makeArgs();
    fetchInstances.mockRejectedValueOnce(new Error('db down'));

    const { result } = renderHook(() =>
      useTradeProposalFlow({
        selectedPokemon: { key: '0001-default' },
        closeOverlay,
        alert,
        fetchInstances,
        fetchTrades,
      }),
    );

    await act(async () => {
      await result.current.proposeTrade();
    });

    expect(alert).toHaveBeenCalledWith('Could not fetch your instances. Aborting trade proposal.');
    expect(fetchTrades).not.toHaveBeenCalled();
    expect(result.current.isTradeProposalOpen).toBe(false);
  });

  it('opens the update-for-trade modal when only caught (not tradeable) instances exist', async () => {
    const { alert, closeOverlay, fetchInstances, fetchTrades } = makeArgs();
    fetchInstances.mockResolvedValueOnce([
      makeInstance({
        instance_id: '0001-default_123e4567-e89b-12d3-a456-426614174000',
        is_caught: true,
        is_for_trade: false,
      }),
    ]);

    const { result } = renderHook(() =>
      useTradeProposalFlow({
        selectedPokemon: { key: '0001-default', name: 'Bulbasaur' },
        closeOverlay,
        alert,
        fetchInstances,
        fetchTrades,
      }),
    );

    await act(async () => {
      await result.current.proposeTrade();
    });

    expect(result.current.isUpdateForTradeModalOpen).toBe(true);
    expect(result.current.currentBaseKey).toBe('0001-default');
    expect(result.current.caughtInstancesToTrade).toHaveLength(1);
    expect(result.current.isTradeProposalOpen).toBe(false);
    expect(fetchTrades).not.toHaveBeenCalled();
  });

  it('opens trade proposal when a tradeable instance is available', async () => {
    const { alert, closeOverlay, fetchInstances, fetchTrades } = makeArgs();
    fetchInstances.mockResolvedValueOnce([
      makeInstance({
        instance_id: '0001-default_123e4567-e89b-12d3-a456-426614174000',
        is_caught: true,
        is_for_trade: true,
      }),
    ]);
    fetchTrades.mockResolvedValueOnce([]);

    const { result } = renderHook(() =>
      useTradeProposalFlow({
        selectedPokemon: {
          key: '0001-default',
          name: 'Bulbasaur',
          species_name: 'Bulbasaur',
        },
        closeOverlay,
        alert,
        fetchInstances,
        fetchTrades,
      }),
    );

    await act(async () => {
      await result.current.proposeTrade();
    });

    expect(closeOverlay).toHaveBeenCalledTimes(1);
    expect(result.current.isTradeProposalOpen).toBe(true);
    expect(result.current.tradeClickedPokemon).toEqual(
      expect.objectContaining({
        matchedInstances: expect.arrayContaining([
          expect.objectContaining({
            name: 'Bulbasaur',
            instanceData: expect.objectContaining({
              instance_id: '0001-default_123e4567-e89b-12d3-a456-426614174000',
            }),
          }),
        ]),
      }),
    );

    act(() => {
      result.current.closeTradeProposal();
    });
    expect(result.current.isTradeProposalOpen).toBe(false);
    expect(result.current.tradeClickedPokemon).toBeNull();
  });
});
