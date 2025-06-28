// hooks/usePokemonImage.ts
import { useEffect, useState } from 'react';
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
  isPurified,
  isGigantamax
}: UsePokemonImageParams) {
  const [image, setImage] = useState<string | undefined>(pokemon.currentImage);

  useEffect(() => {
    if (isDisabled) {
      setImage(`/images/disabled/disabled_${pokemon.pokemon_id}.png`);
      return;
    }

    const updatedImage = determineImageUrl(
      isFemale,
      pokemon,
      isMega,
      megaForm,
      isFused,
      fusionForm,
      isPurified,
      isGigantamax
    );

    setImage(updatedImage);
  }, [
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isPurified,
    isGigantamax,
    pokemon
  ]);

  return image;
}
