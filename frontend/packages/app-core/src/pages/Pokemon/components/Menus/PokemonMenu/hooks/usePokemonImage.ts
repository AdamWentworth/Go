// hooks/usePokemonImage.ts
import { useMemo } from 'react';
import { determineImageUrl } from '@/utils/imageHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface UsePokemonImageParams {
  pokemon: PokemonVariant;
  isDisabled: boolean;
  isFemale: boolean;
  isMega: boolean;
  megaForm?: string;
  isFused?: boolean;
  fusionForm?: string;
  isCrown?: boolean;
  crownForm?: string;
  isPurified: boolean;
  isGigantamax?: boolean;
}

export function usePokemonImage({
  pokemon,
  isDisabled,
  isFemale,
  isMega,
  megaForm,
  isFused,
  fusionForm,
  isCrown,
  crownForm,
  isPurified,
  isGigantamax
}: UsePokemonImageParams) {
  return useMemo(() => {
    if (isDisabled) {
      return `/images/disabled/disabled_${pokemon.pokemon_id}.png`;
    }

    return determineImageUrl(
      isFemale,
      pokemon,
      isMega,
      megaForm,
      isFused,
      fusionForm,
      isPurified,
      isGigantamax,
      isCrown,
      crownForm
    );
  }, [
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isCrown,
    crownForm,
    isPurified,
    isGigantamax,
    pokemon
  ]);
}
