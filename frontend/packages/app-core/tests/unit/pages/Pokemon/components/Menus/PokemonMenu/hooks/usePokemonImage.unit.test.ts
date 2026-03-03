import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { usePokemonImage } from '@/pages/Pokemon/components/Menus/PokemonMenu/hooks/usePokemonImage';

const determineImageUrlMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/imageHelpers', () => ({
  determineImageUrl: determineImageUrlMock,
}));

const basePokemon = {
  pokemon_id: 25,
  currentImage: '/images/default/pokemon_25.png',
  variantType: 'default',
} as any;

describe('usePokemonImage', () => {
  it('returns disabled sprite path and skips resolver when card is disabled', () => {
    determineImageUrlMock.mockReset();

    const { result } = renderHook(() =>
      usePokemonImage({
        pokemon: basePokemon,
        isDisabled: true,
        isFemale: false,
        isMega: false,
        megaForm: undefined,
        isFused: false,
        fusionForm: undefined,
        isPurified: false,
        isGigantamax: false,
      })
    );

    expect(result.current).toBe('/images/disabled/disabled_25.png');
    expect(determineImageUrlMock).not.toHaveBeenCalled();
  });

  it('uses determineImageUrl for non-disabled cards', () => {
    determineImageUrlMock.mockReset();
    determineImageUrlMock.mockReturnValue('/images/custom.png');

    const { result } = renderHook(() =>
      usePokemonImage({
        pokemon: basePokemon,
        isDisabled: false,
        isFemale: true,
        isMega: true,
        megaForm: 'X',
        isFused: true,
        fusionForm: 'fusion_1',
        isPurified: true,
        isGigantamax: true,
      })
    );

    expect(determineImageUrlMock).toHaveBeenCalledWith(
      true,
      basePokemon,
      true,
      'X',
      true,
      'fusion_1',
      true,
      true
    );
    expect(result.current).toBe('/images/custom.png');
  });
});

