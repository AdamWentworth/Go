import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  asNumber,
  normalizeMirrorVariantId,
  type MirrorUpdateDetailsFn,
} from '@/pages/Pokemon/features/instances/utils/mirrorInstanceHelpers';

export type UpdateDetailsFn = MirrorUpdateDetailsFn<Partial<PokemonInstance>>;

export type MirrorPokemon = Omit<
  Partial<PokemonVariant>,
  'instanceData' | 'variant_id' | 'pokemon_id' | 'pokedex_number'
> & {
  instanceData?: Partial<PokemonInstance> & {
    instance_id?: string;
    mirror?: boolean;
    variant_id?: string;
  };
  variant_id?: string;
  pokemon_id?: number | string;
  species_name?: string;
  currentImage?: string;
  pokedex_number?: number | string;
  date_available?: string;
  date_shiny_available?: string;
  date_shadow_available?: string;
  date_shiny_shadow_available?: string;
  variantType?: string;
  name?: string;
  image_url?: string;
};

type FindExistingMirrorKeyArgs = {
  pokemon: MirrorPokemon;
  instanceMap: Record<string, PokemonInstance>;
  onMissingVariant?: (pokemon: MirrorPokemon) => void;
  onResolved?: (key: string | undefined, variantId: string) => void;
};

export const getMirrorVariantId = (pokemon: MirrorPokemon): string | undefined =>
  normalizeMirrorVariantId(pokemon.variant_id) ??
  normalizeMirrorVariantId(pokemon.instanceData?.variant_id);

export const enrichMirrorInstanceForDisplay = (
  source: PokemonInstance,
  pokemon: MirrorPokemon,
): PokemonInstance => ({
  ...source,
  variantType: pokemon.variantType,
  pokedex_number: asNumber(pokemon.pokedex_number),
  currentImage: pokemon.currentImage ?? pokemon.image_url,
  name: pokemon.species_name ?? pokemon.name,
  date_available: pokemon.date_available,
  date_shiny_available: pokemon.date_shiny_available,
  date_shadow_available: pokemon.date_shadow_available,
  date_shiny_shadow_available: pokemon.date_shiny_shadow_available,
  costumes: pokemon.costumes,
  shiny_rarity: pokemon.shiny_rarity,
  rarity: pokemon.rarity,
});

export const findExistingMirrorKey = ({
  pokemon,
  instanceMap,
  onMissingVariant,
  onResolved,
}: FindExistingMirrorKeyArgs): string | undefined => {
  const targetVariant = getMirrorVariantId(pokemon);
  const expectedPokemonId = asNumber(pokemon.pokemon_id);

  if (!targetVariant) {
    onMissingVariant?.(pokemon);
    return undefined;
  }

  const found = Object.entries(instanceMap).find(([, instance]) => {
    const instanceVariant = normalizeMirrorVariantId(instance.variant_id);
    if (instanceVariant !== targetVariant) return false;

    const isWantedOnly = !!instance.is_wanted && !instance.is_caught && !instance.is_for_trade;
    if (!isWantedOnly) return false;

    const instancePokemonId = asNumber(instance.pokemon_id);
    if (
      expectedPokemonId != null &&
      instancePokemonId != null &&
      instancePokemonId !== expectedPokemonId
    ) {
      return false;
    }

    return true;
  });

  const foundKey = found?.[0];
  onResolved?.(foundKey, targetVariant);
  return foundKey;
};

export const buildMirrorTooltipHtml = (pokemon: MirrorPokemon): string =>
  `Toggle Mirror<br>This will create or reference a "Wanted" Pokemon<br>Limiting your Wanted List to a <b><u>${pokemon.species_name ?? pokemon.name ?? 'this Pokemon'}</u></b> only`;
