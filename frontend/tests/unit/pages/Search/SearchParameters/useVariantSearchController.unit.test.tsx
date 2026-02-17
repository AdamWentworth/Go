import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useVariantSearchController from '@/pages/Search/SearchParameters/useVariantSearchController';
import type { BackgroundSelection } from '@/pages/Search/SearchParameters/VariantSearchBackgroundOverlay';
import type { SelectedMoves } from '@/pages/Search/SearchParameters/VariantComponents/MovesSearch';
import type { PokemonVariant } from '@/types/pokemonVariants';

const validatePokemonMock = vi.fn();
const updateImageMock = vi.fn();

vi.mock('@/pages/Search/utils/validatePokemon', () => ({
  default: (...args: unknown[]) => validatePokemonMock(...args),
}));

vi.mock('@/pages/Search/utils/updateImage', () => ({
  updateImage: (...args: unknown[]) => updateImageMock(...args),
}));

type Args = Parameters<typeof useVariantSearchController>[0];

const toSetter = <T,>() => vi.fn() as unknown as React.Dispatch<React.SetStateAction<T>>;

const baseVariant = {
  variant_id: '0001-default',
  name: 'Bulbasaur',
  moves: [],
  costumes: [
    {
      name: 'Party',
      costume_id: 7,
      date_available: '2024-01-01',
      date_shiny_available: null,
      shiny_available: 1,
    },
  ],
  backgrounds: [
    {
      background_id: 101,
      costume_id: null,
      image_url: '/images/bg.png',
      name: 'City',
      location: 'Seattle',
      date: '2025-01-01',
    },
  ],
  max: [
    {
      pokemon_id: 1,
      dynamax: 1,
      gigantamax: 1,
      dynamax_release_date: null,
      gigantamax_release_date: null,
    },
  ],
} as unknown as PokemonVariant;

const makeArgs = (overrides: Partial<Args> = {}): Args => ({
  pokemon: '',
  setPokemon: toSetter<string>(),
  isShiny: false,
  setIsShiny: toSetter<boolean>(),
  isShadow: false,
  setIsShadow: toSetter<boolean>(),
  costume: '',
  setCostume: toSetter<string | null>(),
  selectedForm: '',
  setSelectedForm: toSetter<string>(),
  selectedMoves: {
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  } as SelectedMoves,
  setSelectedMoves: toSetter<SelectedMoves>(),
  selectedGender: 'Any',
  setSelectedGender: toSetter<string | null>(),
  setErrorMessage: toSetter<string | null>(),
  setSelectedBackgroundId: toSetter<number | null>(),
  dynamax: false,
  setDynamax: toSetter<boolean>(),
  gigantamax: false,
  setGigantamax: toSetter<boolean>(),
  pokemonCache: [baseVariant],
  ...overrides,
});

describe('useVariantSearchController', () => {
  beforeEach(() => {
    validatePokemonMock.mockReset();
    updateImageMock.mockReset();

    validatePokemonMock.mockReturnValue({
      error: null,
      availableCostumes: [
        {
          name: 'Party',
          costume_id: 7,
          date_available: '2024-01-01',
        },
      ],
      availableForms: ['None'],
    });
    updateImageMock.mockReturnValue('/images/default.png');
  });

  it('updates suggestions for 3+ character input and clears on shorter values', () => {
    const setSelectedForm = toSetter<string>();
    const setSelectedGender = toSetter<string | null>();
    const setSelectedMoves = toSetter<SelectedMoves>();
    const setDynamax = toSetter<boolean>();
    const setGigantamax = toSetter<boolean>();
    const args = makeArgs({
      setSelectedForm,
      setSelectedGender,
      setSelectedMoves,
      setDynamax,
      setGigantamax,
      pokemonCache: [
        baseVariant,
        { ...baseVariant, variant_id: '0012-default', name: 'Butterfree' } as PokemonVariant,
      ],
    });
    const { result } = renderHook(() => useVariantSearchController(args));

    act(() => {
      result.current.handlePokemonChange({
        target: { value: 'Bul' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(args.setPokemon).toHaveBeenCalledWith('Bul');
    expect(result.current.suggestions).toEqual(['Bulbasaur']);
    expect(setSelectedForm).toHaveBeenCalledWith('');
    expect(setSelectedGender).toHaveBeenCalledWith('Any');
    expect(setSelectedMoves).toHaveBeenCalledWith({
      fastMove: null,
      chargedMove1: null,
      chargedMove2: null,
    });
    expect(setDynamax).toHaveBeenCalledWith(false);
    expect(setGigantamax).toHaveBeenCalledWith(false);

    act(() => {
      result.current.handlePokemonChange({
        target: { value: 'Bu' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.suggestions).toEqual([]);
  });

  it('cycles max state from dynamax to gigantamax when both are available', () => {
    const setDynamax = toSetter<boolean>();
    const setGigantamax = toSetter<boolean>();

    const initialArgs = makeArgs({
      pokemon: 'Bulbasaur',
      dynamax: false,
      gigantamax: false,
      setDynamax,
      setGigantamax,
    });

    const { result, rerender } = renderHook((hookArgs: Args) => useVariantSearchController(hookArgs), {
      initialProps: initialArgs,
    });

    act(() => {
      result.current.toggleMax();
    });

    expect(setDynamax).toHaveBeenCalledWith(true);

    rerender({
      ...initialArgs,
      dynamax: true,
      gigantamax: false,
    });

    act(() => {
      result.current.toggleMax();
    });

    expect(setDynamax).toHaveBeenCalledWith(false);
    expect(setGigantamax).toHaveBeenCalledWith(true);
  });

  it('resets costume when costume dropdown is closed', () => {
    const setCostume = toSetter<string | null>();
    const args = makeArgs({
      pokemon: 'Bulbasaur',
      costume: 'Party',
      setCostume,
    });

    const { result } = renderHook(() => useVariantSearchController(args));

    act(() => {
      result.current.handleCostumeToggle();
    });
    expect(result.current.showCostumeDropdown).toBe(true);

    act(() => {
      result.current.handleCostumeToggle();
    });

    expect(result.current.showCostumeDropdown).toBe(false);
    expect(setCostume).toHaveBeenCalledWith(null);
    expect(
      updateImageMock.mock.calls.some((call) => call[4] === ''),
    ).toBe(true);
  });

  it('recomputes suggestions on input focus when pokemon has 3+ chars', () => {
    const args = makeArgs({
      pokemon: 'Bul',
    });
    const { result } = renderHook(() => useVariantSearchController(args));

    act(() => {
      result.current.handleInputFocus();
    });

    expect(result.current.suggestions).toEqual(['Bulbasaur']);
  });

  it('toggles shiny and shadow flags through dedicated handlers', () => {
    const setIsShiny = toSetter<boolean>();
    const setIsShadow = toSetter<boolean>();
    const args = makeArgs({
      pokemon: 'Bulbasaur',
      isShiny: false,
      isShadow: true,
      setIsShiny,
      setIsShadow,
    });
    const { result } = renderHook(() => useVariantSearchController(args));

    act(() => {
      result.current.handleShinyChange();
    });
    expect(setIsShiny).toHaveBeenCalledWith(true);

    act(() => {
      result.current.handleShadowChange();
    });
    expect(setIsShadow).toHaveBeenCalledWith(false);
  });

  it('applies costume/form changes and suggestion clicks', () => {
    const setCostume = toSetter<string | null>();
    const setSelectedForm = toSetter<string>();
    const setPokemon = toSetter<string>();
    const args = makeArgs({
      pokemon: 'Bul',
      setCostume,
      setSelectedForm,
      setPokemon,
    });
    const { result } = renderHook(() => useVariantSearchController(args));

    act(() => {
      result.current.handleInputFocus();
    });
    expect(result.current.suggestions).toEqual(['Bulbasaur']);

    act(() => {
      result.current.handleCostumeChange({
        target: { value: 'Party' },
      } as React.ChangeEvent<HTMLSelectElement>);
      result.current.handleFormChange({
        target: { value: 'Origin' },
      } as React.ChangeEvent<HTMLSelectElement>);
      result.current.handleSuggestionClick('Bulbasaur');
    });

    expect(setCostume).toHaveBeenCalledWith('Party');
    expect(setSelectedForm).toHaveBeenCalledWith('Origin');
    expect(setPokemon).toHaveBeenCalledWith('Bulbasaur');
    expect(result.current.suggestions).toEqual([]);
  });

  it('applies selected background and closes background overlay', () => {
    const setSelectedBackgroundId = toSetter<number | null>();
    const args = makeArgs({
      pokemon: 'Bulbasaur',
      setSelectedBackgroundId,
    });
    const { result } = renderHook(() => useVariantSearchController(args));

    const background: BackgroundSelection = {
      background_id: 101,
      image_url: '/images/bg.png',
      name: 'City',
      location: 'Seattle',
      date: '2025-01-01',
      costume_id: undefined,
    };

    act(() => {
      result.current.setShowBackgroundOverlay(true);
    });
    expect(result.current.showBackgroundOverlay).toBe(true);

    act(() => {
      result.current.handleBackgroundChange(background);
    });

    expect(result.current.selectedBackground).toEqual(background);
    expect(result.current.showBackgroundOverlay).toBe(false);
    expect(setSelectedBackgroundId).toHaveBeenCalledWith(101);
  });

  it('clears derived state when pokemon input is emptied', async () => {
    const setCostume = toSetter<string | null>();
    const args = makeArgs({
      pokemon: 'Bulbasaur',
      costume: 'Party',
      setCostume,
    });

    const { result } = renderHook(() => useVariantSearchController(args));

    await waitFor(() => {
      expect(result.current.imageUrl).toBe('/images/default.png');
      expect(result.current.availableForms).toEqual(['None']);
      expect(result.current.availableCostumes).toHaveLength(1);
    });

    act(() => {
      result.current.handlePokemonChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.imageUrl).toBeNull();
    expect(result.current.availableForms).toEqual([]);
    expect(result.current.availableCostumes).toEqual([]);
    expect(setCostume).toHaveBeenCalledWith(null);
  });
});
