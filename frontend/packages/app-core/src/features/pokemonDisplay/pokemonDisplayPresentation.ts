import { determineImageUrl } from '@/utils/imageHelpers';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonDisplayAttributes } from './pokemonDisplayModel';

export type PokemonDisplayAttributeSource = PokemonVariant & {
  instanceData?: Partial<PokemonInstance>;
};

export const resolvePokemonDisplayAttributes = (
  pokemon: PokemonDisplayAttributeSource,
): PokemonDisplayAttributes => {
  const ownership = pokemon.instanceData;
  const variantType = pokemon.variantType || '';

  return {
    isDisabled: ownership?.disabled === true,
    isFemale: ownership?.gender === 'Female',
    isMega: ownership?.is_mega === true,
    megaForm: ownership?.mega_form ?? undefined,
    isFused: ownership?.is_fused ?? undefined,
    fusionForm: ownership?.fusion_form ?? undefined,
    isCrown: ownership?.crown === true,
    isPurified: ownership?.purified === true,
    isDynamax: ownership?.gigantamax === true || variantType.includes('dynamax'),
    isGigantamax: ownership?.gigantamax === true || variantType.includes('gigantamax'),
  };
};

export const resolvePokemonDisplayImageUrl = ({
  pokemon,
  attributes,
  crownForm,
}: {
  pokemon: PokemonVariant;
  attributes: PokemonDisplayAttributes;
  crownForm?: string | null;
}): string => {
  if (attributes.isDisabled) {
    return `/images/disabled/disabled_${pokemon.pokemon_id}.png`;
  }

  return determineImageUrl(
    Boolean(attributes.isFemale),
    pokemon,
    Boolean(attributes.isMega),
    attributes.megaForm ?? undefined,
    Boolean(attributes.isFused),
    attributes.fusionForm ?? undefined,
    Boolean(attributes.isPurified),
    Boolean(attributes.isGigantamax),
    Boolean(attributes.isCrown),
    crownForm ?? attributes.crownForm ?? undefined,
  );
};
