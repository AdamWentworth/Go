import { useMemo } from 'react';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

import {
  type FusionState as PersistFusionState,
  type MegaData as PersistMegaData,
  type MovesState,
} from '../utils/buildInstanceChanges';
import { resolveCrownDisplayData } from '../utils/resolveCrownDisplayData';
import { resolveCrownMovePool } from '../utils/resolveCrownMovePool';
import { resolveFusionDisplayData } from '../utils/resolveFusionDisplayData';
import {
  resolveFusionMovePool,
  type FusionMoveSource,
} from '../utils/resolveFusionMovePool';
import { resolveMegaDisplayData } from '../utils/resolveMegaDisplayData';

type CaughtDisplayPokemon = PokemonVariant & {
  instanceData?: PokemonInstance;
};

type CaughtCrownData = {
  isCrown: boolean;
  crownForm: string | null;
};

type CaughtDisplayFusionState = Pick<
  PersistFusionState,
  'is_fused' | 'fusion_form' | 'storedFusionObject'
>;

type CaughtMovesPreviewPokemon = {
  moves?: CaughtDisplayPokemon['moves'];
  fusion?: CaughtDisplayPokemon['fusion'];
  instanceData?: Partial<PokemonInstance>;
};

type UseCaughtInstanceDisplayDataArgs = {
  pokemon: CaughtDisplayPokemon;
  variants: PokemonVariant[];
  fusion: CaughtDisplayFusionState;
  megaData: PersistMegaData;
  crownData: CaughtCrownData;
  moves: MovesState;
};

export const useCaughtInstanceDisplayData = ({
  pokemon,
  variants,
  fusion,
  megaData,
  crownData,
  moves,
}: UseCaughtInstanceDisplayDataArgs) => {
  const resolvedFusionMoves = useMemo(
    () =>
      resolveFusionMovePool({
        pokemon,
        fusion: {
          is_fused: fusion.is_fused,
          fusion_form: fusion.fusion_form,
          storedFusionObject: fusion.storedFusionObject,
        },
      }),
    [fusion.fusion_form, fusion.is_fused, fusion.storedFusionObject, pokemon],
  );

  const resolvedCrownMoves = useMemo(
    () =>
      resolveCrownMovePool({
        pokemon,
        baseMoves: resolvedFusionMoves.moves,
        crown: {
          is_crown: crownData.isCrown,
          crown_form: crownData.crownForm,
        },
      }),
    [crownData.crownForm, crownData.isCrown, pokemon, resolvedFusionMoves.moves],
  );

  const resolvedFusionDisplay = useMemo(
    () =>
      resolveFusionDisplayData({
        pokemon,
        variants,
        fusion: {
          is_fused: fusion.is_fused,
          fusion_form: fusion.fusion_form,
          storedFusionObject: fusion.storedFusionObject,
        },
      }),
    [fusion.fusion_form, fusion.is_fused, fusion.storedFusionObject, pokemon, variants],
  );

  const resolvedMegaDisplay = useMemo(
    () =>
      resolveMegaDisplayData({
        pokemon: {
          ...pokemon,
          type1_name: resolvedFusionDisplay.type1_name,
          type2_name: resolvedFusionDisplay.type2_name,
          type_1_icon: resolvedFusionDisplay.type_1_icon,
          type_2_icon: resolvedFusionDisplay.type_2_icon,
          sizes: resolvedFusionDisplay.sizes,
        },
        variants,
        mega: {
          is_mega: fusion.is_fused ? false : megaData.isMega,
          mega_form: megaData.megaForm,
        },
      }),
    [
      fusion.is_fused,
      megaData.isMega,
      megaData.megaForm,
      pokemon,
      resolvedFusionDisplay.sizes,
      resolvedFusionDisplay.type1_name,
      resolvedFusionDisplay.type2_name,
      resolvedFusionDisplay.type_1_icon,
      resolvedFusionDisplay.type_2_icon,
      variants,
    ],
  );

  const resolvedCrownDisplay = useMemo(
    () =>
      resolveCrownDisplayData({
        pokemon: {
          ...pokemon,
          type1_name: resolvedMegaDisplay.type1_name,
          type2_name: resolvedMegaDisplay.type2_name,
          type_1_icon: resolvedMegaDisplay.type_1_icon,
          type_2_icon: resolvedMegaDisplay.type_2_icon,
          sizes: resolvedMegaDisplay.sizes,
        },
        variants,
        crown: {
          is_crown: fusion.is_fused ? false : crownData.isCrown,
          crown_form: crownData.crownForm,
        },
      }),
    [
      crownData.crownForm,
      crownData.isCrown,
      fusion.is_fused,
      pokemon,
      resolvedMegaDisplay,
      variants,
    ],
  );

  const statsPokemon = useMemo(
    () => ({
      ...pokemon,
      type1_name: resolvedCrownDisplay.type1_name,
      type2_name: resolvedCrownDisplay.type2_name,
      type_1_icon: resolvedCrownDisplay.type_1_icon,
      type_2_icon: resolvedCrownDisplay.type_2_icon,
      sizes: resolvedCrownDisplay.sizes,
      instanceData: pokemon.instanceData,
    }),
    [pokemon, resolvedCrownDisplay],
  );

  const movesPokemon = useMemo<CaughtMovesPreviewPokemon>(
    () => ({
      ...pokemon,
      moves: resolvedCrownMoves.moves,
      instanceData: {
        ...(pokemon.instanceData ?? {}),
        crown: crownData.isCrown,
        fusion_form: fusion.fusion_form,
        is_fused: fusion.is_fused,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
      },
    }),
    [
      fusion.fusion_form,
      fusion.is_fused,
      crownData.isCrown,
      moves.chargedMove1,
      moves.chargedMove2,
      moves.fastMove,
      pokemon,
      resolvedCrownMoves.moves,
    ],
  );

  const fusionMoveMeta = useMemo<{ source: FusionMoveSource; isFused: boolean }>(
    () => ({
      source: resolvedFusionMoves.source,
      isFused: Boolean(fusion.is_fused),
    }),
    [fusion.is_fused, resolvedFusionMoves.source],
  );

  return {
    resolvedFusionMoves,
    resolvedCrownMoves,
    resolvedFusionDisplay,
    resolvedMegaDisplay,
    resolvedCrownDisplay,
    statsPokemon,
    movesPokemon,
    fusionMoveMeta,
  };
};
