// hooks/useSprite.ts
import { useEffect, useState } from 'react';
import { determineImageUrl } from '@/utils/imageHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';

type Inputs = {
  isFemale: boolean;
  pokemon: PokemonVariant;
  isMega: boolean;
  megaForm: string | null;
  isFused: boolean;
  fusionForm: string | null;
  isPurified: boolean;
  gigantamax: boolean;
  isCrown: boolean;
  crownForm: string | null;
};

export function useSprite(inputs: Inputs) {
  const megaForm = inputs.megaForm ?? undefined;
  const fusionForm = inputs.fusionForm ?? undefined;
  const crownForm = inputs.crownForm ?? undefined;

  const [url, setUrl] = useState(
    determineImageUrl(
      inputs.isFemale,
      inputs.pokemon,
      inputs.isMega,
      megaForm,
      inputs.isFused,
      fusionForm,
      inputs.isPurified,
      inputs.gigantamax,
      inputs.isCrown,
      crownForm,
    )
  );

  useEffect(() => {
    setUrl(
      determineImageUrl(
        inputs.isFemale,
        inputs.pokemon,
        inputs.isMega,
        megaForm,
        inputs.isFused,
        fusionForm,
        inputs.isPurified,
        inputs.gigantamax,
        inputs.isCrown,
        crownForm,
      )
    );
  }, [crownForm, fusionForm, inputs.gigantamax, inputs.isCrown, inputs.isFemale, inputs.isFused, inputs.isMega, inputs.isPurified, inputs.pokemon, megaForm]);

  return url;
}
