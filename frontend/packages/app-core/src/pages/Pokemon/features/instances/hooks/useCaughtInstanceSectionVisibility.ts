import { useMemo } from 'react';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

import { hasMetaPanelContent } from '../sections/MetaPanel';
import { hasMovesAndIVContent } from '../sections/MovesAndIV';
import {
  countCaughtFusionOptions,
  resolveCaughtPowerVisibility,
  resolveCaughtSectionVisibility,
} from '../utils/caughtInstanceVisibility';
import type { FusionMoveSource } from '../utils/resolveFusionMovePool';

type MovesVisibilityPokemon = {
  moves?: PokemonVariant['moves'];
  fusion?: PokemonVariant['fusion'];
  instanceData?: Partial<PokemonInstance>;
};

type UseCaughtInstanceSectionVisibilityArgs = {
  pokemon: PokemonVariant & { instanceData?: PokemonInstance };
  movesPokemon: MovesVisibilityPokemon;
  megaEvolutionCount: number;
  crownFormCount: number;
  pokemonName: string;
  variantType?: string | null;
  maxCount: number;
  editMode: boolean;
  isShadow: boolean;
  isPurified: boolean;
  isFused: boolean;
  fusionMoveSource: FusionMoveSource;
  areIVsEmpty: boolean;
  isTraded: boolean;
  originalTrainerName: string | null;
  tradedDate: string | null;
  pokeball: string | null;
};

export const useCaughtInstanceSectionVisibility = ({
  pokemon,
  movesPokemon,
  megaEvolutionCount,
  crownFormCount,
  pokemonName,
  variantType,
  maxCount,
  editMode,
  isShadow,
  isPurified,
  isFused,
  fusionMoveSource,
  areIVsEmpty,
  isTraded,
  originalTrainerName,
  tradedDate,
  pokeball,
}: UseCaughtInstanceSectionVisibilityArgs) => {
  const fusionOptionCount = useMemo(
    () => countCaughtFusionOptions(pokemon.fusion, pokemon.pokemon_id),
    [pokemon.fusion, pokemon.pokemon_id],
  );

  const { showPowerSectionDivider } = useMemo(
    () =>
      resolveCaughtPowerVisibility({
        megaEvolutionCount,
        crownFormCount,
        pokemonName,
        variantType,
        maxCount,
        editMode,
        isShadow,
        isPurified,
        fusionOptionCount,
        isFused,
      }),
    [
      crownFormCount,
      editMode,
      fusionOptionCount,
      isFused,
      isPurified,
      isShadow,
      maxCount,
      megaEvolutionCount,
      pokemonName,
      variantType,
    ],
  );

  const movesAndIVVisible = useMemo(
    () =>
      hasMovesAndIVContent({
        pokemon: movesPokemon,
        editMode,
        fusionMoveSource,
        isFused,
        areIVsEmpty,
      }),
    [areIVsEmpty, editMode, fusionMoveSource, isFused, movesPokemon],
  );

  const metaPanelVisible = useMemo(
    () =>
      hasMetaPanelContent({
        pokemon,
        editMode,
        isTraded,
        originalTrainerName,
        tradedDate,
        pokeball,
      }),
    [editMode, isTraded, originalTrainerName, pokeball, pokemon, tradedDate],
  );

  const { showStatsDivider, showMetaDivider, addStatsBottomGap } = useMemo(
    () =>
      resolveCaughtSectionVisibility({
        showPowerSectionDivider,
        movesAndIVVisible,
        metaPanelVisible,
      }),
    [metaPanelVisible, movesAndIVVisible, showPowerSectionDivider],
  );

  return {
    fusionOptionCount,
    showPowerSectionDivider,
    movesAndIVVisible,
    metaPanelVisible,
    showStatsDivider,
    showMetaDivider,
    addStatsBottomGap,
  };
};
