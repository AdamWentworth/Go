import validatePokemon from '../utils/validatePokemon';
import { updateImage } from '../utils/updateImage';
import {
  normalizeAvailableForms,
  sortCostumesByDate,
  type SortableCostume,
} from './variantSearchHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type VariantValidationState = {
  name: string;
  shinyChecked: boolean;
  shadowChecked: boolean;
  selectedCostume: string | null;
  form: string;
  selectedGenderValue: string | null;
  dynamaxEnabled: boolean;
  gigantamaxEnabled: boolean;
};

type VariantValidationOutcome = {
  error: string | null;
  availableCostumes: SortableCostume[];
  availableForms: string[];
  imageUrl?: string | null;
};

type RunVariantValidationArgs = {
  pokemonData: PokemonVariant[];
  state: VariantValidationState;
  validatePokemonFn?: typeof validatePokemon;
  updateImageFn?: typeof updateImage;
};

type ValidatePokemonResult = ReturnType<typeof validatePokemon>;

const toValidatePokemonInput = (
  pokemonData: PokemonVariant[],
): Parameters<typeof validatePokemon>[0] =>
  pokemonData as unknown as Parameters<typeof validatePokemon>[0];

export const buildVariantValidationState = (
  base: VariantValidationState,
  overrides: Partial<VariantValidationState> = {},
): VariantValidationState => ({
  ...base,
  ...overrides,
});

export const runVariantValidation = ({
  pokemonData,
  state,
  validatePokemonFn = validatePokemon,
  updateImageFn = updateImage,
}: RunVariantValidationArgs): VariantValidationOutcome => {
  const {
    error,
    availableCostumes: validatedCostumes,
    availableForms: validatedForms,
  } = validatePokemonFn(
    toValidatePokemonInput(pokemonData),
    state.name,
    state.shinyChecked,
    state.shadowChecked,
    state.selectedCostume,
    state.form,
    state.dynamaxEnabled,
    state.gigantamaxEnabled,
  ) as ValidatePokemonResult;

  const availableCostumes = sortCostumesByDate(
    validatedCostumes as unknown as SortableCostume[],
  );
  const availableForms = normalizeAvailableForms(validatedForms);

  if (error) {
    return {
      error,
      availableCostumes,
      availableForms,
    };
  }

  const imageUrl = updateImageFn(
    pokemonData,
    state.name,
    state.shinyChecked,
    state.shadowChecked,
    state.selectedCostume,
    state.form,
    state.selectedGenderValue,
    state.gigantamaxEnabled,
  );

  return {
    error: null,
    availableCostumes,
    availableForms,
    imageUrl,
  };
};

export const EMPTY_SELECTED_MOVES = {
  fastMove: null,
  chargedMove1: null,
  chargedMove2: null,
} as const;

