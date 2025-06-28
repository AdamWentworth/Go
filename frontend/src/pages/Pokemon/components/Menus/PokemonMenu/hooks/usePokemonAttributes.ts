// hooks/usePokemonAttributes.ts

import type { PokemonVariant } from "@/types/pokemonVariants";
import type { PokemonInstance } from "@/types/pokemonInstance";

export function usePokemonAttributes(
  pokemon: PokemonVariant & { instanceData?: Partial<PokemonInstance> }
) {
  const ownership = pokemon.instanceData;

  const isDisabled = ownership?.disabled === true;
  const isFemale = ownership?.gender === 'Female';
  const isMega = ownership?.is_mega === true;
  const megaForm = ownership?.mega_form ?? undefined;
  const isFused = ownership?.is_fused ?? undefined;
  const fusionForm = ownership?.fusion_form ?? undefined;
  const isPurified = ownership?.purified === true;

  const variantType = pokemon.variantType || '';
  const isDynamax = ownership?.gigantamax === true || variantType.includes('dynamax');
  const isGigantamax = ownership?.gigantamax === true || variantType.includes('gigantamax');

  return {
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isPurified,
    isDynamax,
    isGigantamax,
  };
}
