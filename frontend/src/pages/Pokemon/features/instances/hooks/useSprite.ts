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
  const [url, setUrl] = useState(
    determineImageUrl(inputs.isFemale, inputs.pokemon, inputs.isMega, inputs.megaForm)
  );

  useEffect(() => {
    setUrl(
      determineImageUrl(
        inputs.isFemale,
        inputs.pokemon,
        inputs.isMega,
        inputs.megaForm,
        inputs.isFused,
        inputs.fusionForm,
        inputs.isPurified,
        inputs.gigantamax,
      )
    );
  }, [inputs]);

  return url;
}
