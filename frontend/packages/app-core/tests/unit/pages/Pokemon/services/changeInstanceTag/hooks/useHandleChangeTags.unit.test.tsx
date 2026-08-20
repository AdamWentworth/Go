import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useHandleChangeTags from '@/pages/Pokemon/services/changeInstanceTag/hooks/useHandleChangeTags';

const modal = vi.hoisted(() => ({
  confirm: vi.fn(),
  alert: vi.fn(),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => modal,
}));

describe('useHandleChangeTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modal.alert.mockResolvedValue(undefined);
  });

  it('confirms before opening special Pokémon selectors and leaves selection intact on cancel', async () => {
    modal.confirm.mockResolvedValue(false);
    const promptMegaPokemonSelection = vi.fn();
    const updateInstanceStatus = vi.fn();
    const setHighlightedCards = vi.fn();
    const setIsFastSelectEnabled = vi.fn();

    const { result } = renderHook(() => useHandleChangeTags({
      setTagFilter: vi.fn(),
      setLastMenu: vi.fn(),
      setHighlightedCards,
      highlightedCards: new Set(['0003-mega']),
      updateInstanceStatus,
      variants: [{
        variant_id: '0003-mega',
        pokemon_id: 3,
        species_name: 'Mega Venusaur',
      } as any],
      instances: {},
      updateInstanceDetails: vi.fn(),
      setIsUpdating: vi.fn(),
      promptMegaPokemonSelection,
      promptFusionPokemonSelection: vi.fn(),
      setIsFastSelectEnabled,
    }));

    let outcomes: Awaited<ReturnType<typeof result.current.handleConfirmChangeTags>> = [];
    await act(async () => {
      outcomes = await result.current.handleConfirmChangeTags('Caught');
    });

    expect(modal.confirm).toHaveBeenCalledTimes(1);
    expect(promptMegaPokemonSelection).not.toHaveBeenCalled();
    expect(updateInstanceStatus).not.toHaveBeenCalled();
    expect(setHighlightedCards).not.toHaveBeenCalled();
    expect(setIsFastSelectEnabled).not.toHaveBeenCalled();
    expect(outcomes).toEqual([]);
  });
});
