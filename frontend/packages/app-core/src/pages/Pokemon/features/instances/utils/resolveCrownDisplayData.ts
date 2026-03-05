import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveActiveCrownForm } from '@/utils/crownHelpers';

type CrownDisplayState = {
  is_crown: boolean;
  crown_form: string | null;
};

type CrownDisplayPokemon = {
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
  crownForms?: PokemonVariant['crownForms'];
};

type CrownDisplayVariant = {
  pokemon_id: number;
  variantType?: string;
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
};

type ResolveCrownDisplayDataArgs = {
  pokemon: CrownDisplayPokemon;
  crown: CrownDisplayState;
  variants?: CrownDisplayVariant[];
};

export type ResolveCrownDisplayDataResult = {
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
  source: 'base' | 'crown';
  crownPokemonId: number | null;
};

const buildTypeIcon = (typeName?: string | null): string | undefined => {
  const normalized = typeof typeName === 'string' ? typeName.trim().toLowerCase() : '';
  return normalized ? `/images/types/${normalized}.png` : undefined;
};

export const resolveCrownDisplayData = ({
  pokemon,
  crown,
  variants = [],
}: ResolveCrownDisplayDataArgs): ResolveCrownDisplayDataResult => {
  const baseType1 = pokemon.type1_name;
  const baseType2 = pokemon.type2_name;
  const baseType1Icon = pokemon.type_1_icon ?? buildTypeIcon(baseType1);
  const baseType2Icon = pokemon.type_2_icon ?? buildTypeIcon(baseType2);

  const base: ResolveCrownDisplayDataResult = {
    type1_name: baseType1,
    type2_name: baseType2,
    type_1_icon: baseType1Icon,
    type_2_icon: baseType2Icon,
    sizes: pokemon.sizes,
    source: 'base',
    crownPokemonId: null,
  };

  if (!crown.is_crown) return base;

  const selectedCrown = resolveActiveCrownForm(pokemon.crownForms, crown.crown_form);
  if (!selectedCrown) return base;

  const crownPokemonId =
    typeof selectedCrown.crown_pokemon_id === 'number' ? selectedCrown.crown_pokemon_id : null;

  const crownVariant =
    crownPokemonId == null
      ? undefined
      : variants.find(
          (variant) =>
            variant.pokemon_id === crownPokemonId &&
            variant.variantType === 'default',
        ) ??
        variants.find((variant) => variant.pokemon_id === crownPokemonId);

  const resolvedType1 =
    selectedCrown.type1_name ?? crownVariant?.type1_name ?? baseType1;
  const resolvedType2 =
    selectedCrown.type2_name ?? crownVariant?.type2_name ?? baseType2;

  const resolvedType1Icon =
    crownVariant?.type_1_icon ??
    buildTypeIcon(resolvedType1) ??
    baseType1Icon;
  const resolvedType2Icon = resolvedType2
    ? crownVariant?.type_2_icon ??
      buildTypeIcon(resolvedType2) ??
      baseType2Icon
    : undefined;

  return {
    type1_name: resolvedType1,
    type2_name: resolvedType2,
    type_1_icon: resolvedType1Icon,
    type_2_icon: resolvedType2Icon,
    sizes: crownVariant?.sizes ?? pokemon.sizes,
    source: 'crown',
    crownPokemonId,
  };
};
