import type { PokemonVariant } from '@/types/pokemonVariants';
import type { MegaEvolution } from '@/types/pokemonSubTypes';
import {
  buildTypeIcon,
  normalizeFormToken,
  normalizeTypeName,
  resolvePokemonDisplayActiveMegaEvolution,
} from './displayHelpers';

type MegaDisplayState = {
  is_mega: boolean;
  mega_form: string | null;
};

type MegaDisplayPokemon = {
  pokemon_id: number;
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
  megaEvolutions?: MegaEvolution[];
};

type MegaDisplayVariant = {
  pokemon_id: number;
  variantType?: string;
  megaForm?: string;
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
};

type ResolveMegaDisplayDataArgs = {
  pokemon: MegaDisplayPokemon;
  mega: MegaDisplayState;
  variants?: MegaDisplayVariant[];
};

export type ResolveMegaDisplayDataResult = {
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
  source: 'base' | 'mega';
  megaVariantType: string | null;
};

const isMegaVariantType = (variantType: string | undefined): boolean => {
  const normalized = String(variantType ?? '').toLowerCase();
  return (
    normalized === 'primal' ||
    normalized === 'shiny_primal' ||
    normalized.startsWith('mega') ||
    normalized.startsWith('shiny_mega')
  );
};

const resolveMegaVariantType = (megaEvolution: MegaEvolution): string => {
  const explicit = typeof megaEvolution.variantType === 'string' ? megaEvolution.variantType.trim() : '';
  if (explicit.length > 0) return explicit;
  const suffix = megaEvolution.form ? `_${megaEvolution.form.toLowerCase()}` : '';
  return megaEvolution.primal ? 'primal' : `mega${suffix}`;
};

const preferNonShinyVariant = (
  entries: MegaDisplayVariant[],
): MegaDisplayVariant | undefined =>
  entries.find((entry) => !String(entry.variantType ?? '').toLowerCase().startsWith('shiny_')) ??
  entries[0];

const resolveMegaVariant = ({
  variants,
  pokemonId,
  selectedMegaEvolution,
}: {
  variants: MegaDisplayVariant[];
  pokemonId: number;
  selectedMegaEvolution: MegaEvolution;
}): MegaDisplayVariant | undefined => {
  const megaCandidates = variants.filter(
    (variant) => variant.pokemon_id === pokemonId && isMegaVariantType(variant.variantType),
  );
  if (megaCandidates.length === 0) return undefined;

  const targetVariantType = resolveMegaVariantType(selectedMegaEvolution).toLowerCase();

  const exact = megaCandidates.filter(
    (variant) => String(variant.variantType ?? '').toLowerCase() === targetVariantType,
  );
  if (exact.length > 0) return preferNonShinyVariant(exact);

  const shinyExact = megaCandidates.filter(
    (variant) => String(variant.variantType ?? '').toLowerCase() === `shiny_${targetVariantType}`,
  );
  if (shinyExact.length > 0) return preferNonShinyVariant(shinyExact);

  const normalizedForm = normalizeFormToken(selectedMegaEvolution.form);
  if (normalizedForm.length > 0) {
    const byMegaForm = megaCandidates.filter(
      (variant) => normalizeFormToken(variant.megaForm) === normalizedForm,
    );
    if (byMegaForm.length > 0) return preferNonShinyVariant(byMegaForm);
  }

  return preferNonShinyVariant(megaCandidates);
};

export const resolveMegaDisplayData = ({
  pokemon,
  mega,
  variants = [],
}: ResolveMegaDisplayDataArgs): ResolveMegaDisplayDataResult => {
  const baseType1 = pokemon.type1_name;
  const baseType2 = pokemon.type2_name;
  const baseType1Icon = pokemon.type_1_icon ?? buildTypeIcon(baseType1);
  const baseType2Icon = pokemon.type_2_icon ?? buildTypeIcon(baseType2);

  const base: ResolveMegaDisplayDataResult = {
    type1_name: baseType1,
    type2_name: baseType2,
    type_1_icon: baseType1Icon,
    type_2_icon: baseType2Icon,
    sizes: pokemon.sizes,
    source: 'base',
    megaVariantType: null,
  };

  if (!mega.is_mega) return base;

  const selectedMegaEvolution = resolvePokemonDisplayActiveMegaEvolution({
    isMega: true,
    megaForm: mega.mega_form,
    megaEvolutions: pokemon.megaEvolutions,
  });
  if (!selectedMegaEvolution) return base;

  const megaVariantType = resolveMegaVariantType(selectedMegaEvolution);
  const megaVariant = resolveMegaVariant({
    variants,
    pokemonId: pokemon.pokemon_id,
    selectedMegaEvolution,
  });

  const resolvedType1 =
    normalizeTypeName(selectedMegaEvolution.type1_name) ??
    normalizeTypeName(megaVariant?.type1_name) ??
    baseType1;
  const megaHasType2ById =
    typeof selectedMegaEvolution.type_2_id === 'number' && selectedMegaEvolution.type_2_id > 0;
  const resolvedType2 =
    normalizeTypeName(selectedMegaEvolution.type2_name) ??
    (megaHasType2ById
      ? normalizeTypeName(megaVariant?.type2_name) ?? baseType2
      : undefined);

  const resolvedType1Icon =
    megaVariant?.type_1_icon ??
    buildTypeIcon(resolvedType1) ??
    baseType1Icon;

  const resolvedType2Icon = resolvedType2
    ? megaVariant?.type_2_icon ??
      buildTypeIcon(resolvedType2) ??
      baseType2Icon
    : undefined;

  return {
    type1_name: resolvedType1,
    type2_name: resolvedType2,
    type_1_icon: resolvedType1Icon,
    type_2_icon: resolvedType2Icon,
    sizes: megaVariant?.sizes ?? pokemon.sizes,
    source: 'mega',
    megaVariantType,
  };
};
