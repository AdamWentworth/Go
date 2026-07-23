import type { PokemonInstance } from '@/types/pokemonInstance';
import type { CrownForm, MegaEvolution } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { isSpecialMaxMoveEligible } from '@/features/max/specialMaxPokemon';

import type { MegaData } from './buildInstanceChanges';

type PowerPanelPokemon = {
  pokemon_id?: number;
  image_url?: string;
  image_url_shiny?: string;
  variantType?: PokemonVariant['variantType'];
  variant_id?: PokemonVariant['variant_id'];
  form?: string | null;
  max?: PokemonVariant['max'];
  instanceData?: Partial<PokemonInstance>;
};

type ResolvePowerPanelStateArgs = {
  pokemon: PowerPanelPokemon;
  editMode: boolean;
  megaData?: MegaData | Partial<MegaData>;
  megaEvolutions?: MegaEvolution[];
  crownForms?: CrownForm[];
  crownData?: { isCrown: boolean; crownForm: string | null };
  isShadow: boolean;
  name: string;
};

export const resolvePowerPanelState = ({
  pokemon,
  editMode,
  megaData,
  megaEvolutions = [],
  crownForms = [],
  crownData,
  isShadow,
  name,
}: ResolvePowerPanelStateArgs) => {
  const normalizedMegaData: MegaData = {
    isMega: Boolean(megaData?.isMega),
    mega: Boolean(megaData?.mega),
    megaForm: megaData?.megaForm ?? null,
  };

  const hasMaxVariant =
    typeof pokemon.variantType === 'string' &&
    (pokemon.variantType.includes('dynamax') || pokemon.variantType.includes('gigantamax'));
  const hasSpecialMaxAccess = isSpecialMaxMoveEligible({
    pokemonId: pokemon.pokemon_id,
    variantType: pokemon.variantType,
    form: crownData?.isCrown ? crownData.crownForm : pokemon.form,
    isCrowned: crownData?.isCrown,
  });
  const hasCatalogMaxAccess =
    hasMaxVariant && Array.isArray(pokemon.max) && pokemon.max.length > 0;

  const canRenderMax =
    editMode &&
    (hasCatalogMaxAccess || hasSpecialMaxAccess) &&
    !pokemon.instanceData?.shadow &&
    !pokemon.instanceData?.purified &&
    !pokemon.variantType?.includes('costume');
  const canRenderMega =
    Array.isArray(megaEvolutions) &&
    megaEvolutions.length > 0 &&
    !isShadow &&
    !name.toLowerCase().includes('clone');
  const canRenderCrown = Array.isArray(crownForms) && crownForms.length > 0 && !isShadow;
  const isShiny =
    Boolean(pokemon.instanceData?.shiny) ||
    (typeof pokemon.variantType === 'string' && pokemon.variantType.includes('shiny'));
  const renderedPowerCount =
    Number(canRenderMax) + Number(canRenderMega) + Number(canRenderCrown);

  return {
    normalizedMegaData,
    hasMaxVariant,
    hasSpecialMaxAccess,
    hasCatalogMaxAccess,
    canRenderMax,
    canRenderMega,
    canRenderCrown,
    isShiny,
    renderedPowerCount,
  };
};
