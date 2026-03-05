import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Fusion } from '@/types/pokemonSubTypes';

type FusionDisplayState = {
  is_fused: boolean;
  fusion_form: string | null;
  storedFusionObject?: Record<string, unknown> | null;
};

type FusionDisplayPokemon = {
  pokemon_id: number;
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
  fusion?: Fusion[];
};

type FusionDisplayVariant = {
  pokemon_id: number;
  variantType?: string;
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
};

type ResolveFusionDisplayDataArgs = {
  pokemon: FusionDisplayPokemon;
  fusion: FusionDisplayState;
  variants?: FusionDisplayVariant[];
};

export type ResolveFusionDisplayDataResult = {
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
  sizes?: PokemonVariant['sizes'];
  source: 'base' | 'fusion';
  fusionId: number | null;
};

const normalizeToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const parseFusionId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const buildTypeIcon = (typeName?: string | null): string | undefined => {
  const normalized = typeof typeName === 'string' ? typeName.trim().toLowerCase() : '';
  return normalized ? `/images/types/${normalized}.png` : undefined;
};

const resolveActiveFusion = (
  fusionEntries: Fusion[],
  fusionForm: string | null,
  storedFusionObject: Record<string, unknown> | null | undefined,
): Fusion | undefined => {
  const normalizedFusionForm = normalizeToken(fusionForm);
  if (normalizedFusionForm.length > 0) {
    const byForm = fusionEntries.find(
      (entry) => normalizeToken(entry.name) === normalizedFusionForm,
    );
    if (byForm) return byForm;
  }

  const storedFusionId =
    parseFusionId(storedFusionObject?.fusion_id) ??
    parseFusionId(storedFusionObject?.id);
  if (storedFusionId != null) {
    const byId = fusionEntries.find((entry) => entry.fusion_id === storedFusionId);
    if (byId) return byId;
  }

  return fusionEntries[0];
};

const resolveFusionVariant = ({
  variants,
  pokemonId,
  fusionId,
}: {
  variants: FusionDisplayVariant[];
  pokemonId: number;
  fusionId: number | null;
}): FusionDisplayVariant | undefined => {
  if (fusionId == null) return undefined;
  const expected = `fusion_${fusionId}`;
  const expectedShiny = `shiny_fusion_${fusionId}`;
  return (
    variants.find(
      (variant) =>
        variant.pokemon_id === pokemonId &&
        String(variant.variantType ?? '').toLowerCase() === expected,
    ) ??
    variants.find(
      (variant) =>
        variant.pokemon_id === pokemonId &&
        String(variant.variantType ?? '').toLowerCase() === expectedShiny,
    )
  );
};

export const resolveFusionDisplayData = ({
  pokemon,
  fusion,
  variants = [],
}: ResolveFusionDisplayDataArgs): ResolveFusionDisplayDataResult => {
  const baseType1 = pokemon.type1_name;
  const baseType2 = pokemon.type2_name;
  const baseType1Icon = pokemon.type_1_icon ?? buildTypeIcon(baseType1);
  const baseType2Icon = pokemon.type_2_icon ?? buildTypeIcon(baseType2);

  const base: ResolveFusionDisplayDataResult = {
    type1_name: baseType1,
    type2_name: baseType2,
    type_1_icon: baseType1Icon,
    type_2_icon: baseType2Icon,
    sizes: pokemon.sizes,
    source: 'base',
    fusionId: null,
  };

  if (!fusion.is_fused) return base;
  const fusionEntries = Array.isArray(pokemon.fusion) ? pokemon.fusion : [];
  if (fusionEntries.length === 0) return base;

  const selectedFusion = resolveActiveFusion(
    fusionEntries,
    fusion.fusion_form,
    fusion.storedFusionObject,
  );
  if (!selectedFusion) return base;

  const fusionId =
    typeof selectedFusion.fusion_id === 'number' ? selectedFusion.fusion_id : null;
  const fusionVariant = resolveFusionVariant({
    variants,
    pokemonId: pokemon.pokemon_id,
    fusionId,
  });

  const resolvedType1 =
    selectedFusion.type1_name ?? fusionVariant?.type1_name ?? baseType1;
  const resolvedType2 =
    selectedFusion.type2_name ?? fusionVariant?.type2_name ?? baseType2;
  const resolvedType1Icon =
    fusionVariant?.type_1_icon ??
    buildTypeIcon(resolvedType1) ??
    baseType1Icon;
  const resolvedType2Icon = resolvedType2
    ? fusionVariant?.type_2_icon ??
      buildTypeIcon(resolvedType2) ??
      baseType2Icon
    : undefined;

  return {
    type1_name: resolvedType1,
    type2_name: resolvedType2,
    type_1_icon: resolvedType1Icon,
    type_2_icon: resolvedType2Icon,
    sizes: fusionVariant?.sizes ?? pokemon.sizes,
    source: 'fusion',
    fusionId,
  };
};

