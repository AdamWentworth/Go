import { describe, expect, it, vi } from 'vitest';

import {
  buildVariantValidationState,
  evaluateCostumeToggle,
  evaluatePokemonInputFocus,
  evaluatePokemonInputChange,
  runVariantValidation,
} from '@/pages/Search/SearchParameters/variantSearchControllerHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';

const pokemonData = [
  { name: 'Bulbasaur' },
] as unknown as PokemonVariant[];

describe('variantSearchControllerHelpers', () => {
  it('builds validation state with overrides', () => {
    const state = buildVariantValidationState(
      {
        name: 'Bulbasaur',
        shinyChecked: false,
        shadowChecked: false,
        selectedCostume: '',
        form: '',
        selectedGenderValue: 'Any',
        dynamaxEnabled: false,
        gigantamaxEnabled: false,
      },
      {
        shinyChecked: true,
        form: 'Rockstar',
      },
    );

    expect(state).toMatchObject({
      name: 'Bulbasaur',
      shinyChecked: true,
      shadowChecked: false,
      form: 'Rockstar',
    });
  });

  it('runs validation and returns normalized forms/sorted costumes + image URL', () => {
    const validatePokemonFn = vi.fn().mockReturnValue({
      error: null,
      availableCostumes: [
        { name: 'Late', costume_id: 2, date_available: '2025-01-01' },
        { name: 'Early', costume_id: 1, date_available: '2024-01-01' },
      ],
      availableForms: ['None', 'Rockstar', ''],
    });
    const updateImageFn = vi.fn().mockReturnValue('/images/bulbasaur.png');

    const result = runVariantValidation({
      pokemonData,
      state: {
        name: 'Bulbasaur',
        shinyChecked: false,
        shadowChecked: false,
        selectedCostume: '',
        form: '',
        selectedGenderValue: 'Any',
        dynamaxEnabled: false,
        gigantamaxEnabled: false,
      },
      validatePokemonFn,
      updateImageFn,
    });

    expect(result.error).toBeNull();
    expect(result.availableCostumes.map((item) => item.name)).toEqual(['Early', 'Late']);
    expect(result.availableForms).toEqual(['None', 'Rockstar']);
    expect(result.imageUrl).toBe('/images/bulbasaur.png');
    expect(updateImageFn).toHaveBeenCalledTimes(1);
  });

  it('does not compute image URL when validation returns an error', () => {
    const validatePokemonFn = vi.fn().mockReturnValue({
      error: 'Bad input',
      availableCostumes: [],
      availableForms: [],
    });
    const updateImageFn = vi.fn();

    const result = runVariantValidation({
      pokemonData,
      state: {
        name: 'Bulbasaur',
        shinyChecked: false,
        shadowChecked: false,
        selectedCostume: '',
        form: '',
        selectedGenderValue: 'Any',
        dynamaxEnabled: false,
        gigantamaxEnabled: false,
      },
      validatePokemonFn,
      updateImageFn,
    });

    expect(result.error).toBe('Bad input');
    expect(result.imageUrl).toBeUndefined();
    expect(updateImageFn).not.toHaveBeenCalled();
  });

  it('evaluates pokemon input changes for ignore/reset/suggestion outcomes', () => {
    expect(
      evaluatePokemonInputChange({
        nextPokemon: 'Bulbasaur1234',
        pokemonData,
      }),
    ).toEqual({
      shouldIgnore: true,
      shouldResetDerivedState: false,
      suggestions: [],
    });

    expect(
      evaluatePokemonInputChange({
        nextPokemon: '   ',
        pokemonData,
      }),
    ).toEqual({
      shouldIgnore: false,
      shouldResetDerivedState: true,
      suggestions: [],
    });

    expect(
      evaluatePokemonInputChange({
        nextPokemon: 'Bu',
        pokemonData,
      }),
    ).toEqual({
      shouldIgnore: false,
      shouldResetDerivedState: false,
      suggestions: [],
    });

    expect(
      evaluatePokemonInputChange({
        nextPokemon: 'Bul',
        pokemonData,
      }),
    ).toEqual({
      shouldIgnore: false,
      shouldResetDerivedState: false,
      suggestions: ['Bulbasaur'],
    });
  });

  it('evaluates pokemon input focus suggestions', () => {
    expect(
      evaluatePokemonInputFocus({
        pokemon: '',
        pokemonData,
      }),
    ).toEqual([]);

    expect(
      evaluatePokemonInputFocus({
        pokemon: 'Bu',
        pokemonData,
      }),
    ).toEqual([]);

    expect(
      evaluatePokemonInputFocus({
        pokemon: 'Bul',
        pokemonData,
      }),
    ).toEqual(['Bulbasaur']);
  });

  it('evaluates costume toggle open/close decisions', () => {
    expect(
      evaluateCostumeToggle({
        showCostumeDropdown: false,
      }),
    ).toEqual({
      nextShowCostumeDropdown: true,
      shouldResetCostumeSelection: false,
    });

    expect(
      evaluateCostumeToggle({
        showCostumeDropdown: true,
      }),
    ).toEqual({
      nextShowCostumeDropdown: false,
      shouldResetCostumeSelection: true,
    });
  });
});
