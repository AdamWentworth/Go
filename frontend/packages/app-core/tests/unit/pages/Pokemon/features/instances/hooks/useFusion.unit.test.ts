import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFusion } from '@/pages/Pokemon/features/instances/hooks/useFusion';
import { getValidCandidates } from '@/pages/Pokemon/features/fusion/core/getValidCandidates';

vi.mock('@/pages/Pokemon/features/fusion/core/getValidCandidates', () => ({
  getValidCandidates: vi.fn(),
}));

describe('useFusion', () => {
  it('looks up base_pokemon_id2 candidates with ignoreShiny enabled', async () => {
    vi.mocked(getValidCandidates).mockResolvedValue([]);
    const alert = vi.fn();

    const pokemon = {
      pokemon_id: 646,
      fusion: [
        {
          fusion_id: 1,
          base_pokemon_id1: 646,
          base_pokemon_id2: 643,
          name: 'white_kyurem',
        },
      ],
      instanceData: {
        is_caught: true,
        is_for_trade: false,
        shiny: true,
      },
    } as any;

    const { result } = renderHook(() => useFusion(pokemon, alert));

    await act(async () => {
      await result.current.handleFusionToggle(1);
    });

    expect(getValidCandidates).toHaveBeenCalledWith(
      '0643',
      true,
      true,
      [],
      null,
    );
  });

  it('keeps previously fused partner eligible after undo without saving', async () => {
    vi.mocked(getValidCandidates).mockResolvedValue([]);
    const alert = vi.fn();

    const pokemon = {
      pokemon_id: 646,
      fusion: [
        {
          fusion_id: 1,
          base_pokemon_id1: 646,
          base_pokemon_id2: 643,
          name: 'white_kyurem',
        },
      ],
      instanceData: {
        is_caught: true,
        is_for_trade: false,
        shiny: false,
        is_fused: true,
        instance_id: '0646-default-kyurem',
        fused_with: 'reshiram-instance-1',
        fusion_form: 'White Kyurem',
      },
    } as any;

    const { result } = renderHook(() => useFusion(pokemon, alert));

    act(() => {
      result.current.handleUndoFusion();
    });

    await act(async () => {
      await result.current.handleFusionToggle(1);
    });

    expect(getValidCandidates).toHaveBeenCalledWith(
      '0643',
      false,
      true,
      ['reshiram-instance-1'],
      '0646-default-kyurem',
    );
  });
});
