// hooks/useSprite.ts
import { useEffect, useState } from 'react';
import { determineImageUrl } from '@/utils/imageHelpers';

type Inputs = {
  isFemale: boolean;
  pokemon: any;
  isMega: boolean;
  megaForm: string | null;
  isFused: boolean;
  fusionForm: string | null;
  isPurified: boolean;
  gigantamax: boolean;
};

export function useSprite(inputs: Inputs) {
  const megaForm = inputs.megaForm ?? undefined;
  const fusionForm = inputs.fusionForm ?? undefined;

  const [url, setUrl] = useState(
    determineImageUrl(inputs.isFemale, inputs.pokemon, inputs.isMega, megaForm)
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
      )
    );
  }, [fusionForm, inputs.gigantamax, inputs.isFemale, inputs.isFused, inputs.isMega, inputs.isPurified, inputs.pokemon, megaForm]);

  return url;
}
