import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

import { resolveCrownDisplayData } from './crownDisplayData';
import { resolveCrownMovePool } from './crownMovePool';
import { resolveFusionDisplayData } from './fusionDisplayData';
import {
  resolveFusionMovePool,
  type FusionMoveSource,
} from './fusionMovePool';
import { resolveMegaDisplayData } from './megaDisplayData';

export type CaughtDisplayPokemon = PokemonVariant & {
  instanceData?: PokemonInstance;
};

export type CaughtCrownData = {
  isCrown: boolean;
  crownForm: string | null;
};

export type CaughtDisplayFusionState = {
  is_fused: boolean;
  fusion_form: string | null;
  storedFusionObject?: Record<string, unknown> | null;
};

export type CaughtMegaData = {
  isMega: boolean;
  mega?: boolean;
  megaForm: string | null;
};

export type CaughtMovesState = {
  fastMove: number | null;
  chargedMove1: number | null;
  chargedMove2: number | null;
};

export type CaughtMovesPreviewPokemon = {
  moves?: CaughtDisplayPokemon['moves'];
  fusion?: CaughtDisplayPokemon['fusion'];
  instanceData?: Partial<PokemonInstance>;
};

export type CaughtPokemonDisplayModelArgs = {
  pokemon: CaughtDisplayPokemon;
  variants: PokemonVariant[];
  fusion: CaughtDisplayFusionState;
  megaData: CaughtMegaData;
  crownData: CaughtCrownData;
  moves: CaughtMovesState;
};

export const buildCaughtPokemonDisplayModel = ({
  pokemon,
  variants,
  fusion,
  megaData,
  crownData,
  moves,
}: CaughtPokemonDisplayModelArgs) => {
  const resolvedFusionMoves = resolveFusionMovePool({
    pokemon,
    fusion: {
      is_fused: fusion.is_fused,
      fusion_form: fusion.fusion_form,
      storedFusionObject: fusion.storedFusionObject,
    },
  });

  const resolvedCrownMoves = resolveCrownMovePool({
    pokemon,
    baseMoves: resolvedFusionMoves.moves,
    crown: {
      is_crown: crownData.isCrown,
      crown_form: crownData.crownForm,
    },
  });

  const resolvedFusionDisplay = resolveFusionDisplayData({
    pokemon,
    variants,
    fusion: {
      is_fused: fusion.is_fused,
      fusion_form: fusion.fusion_form,
      storedFusionObject: fusion.storedFusionObject,
    },
  });

  const resolvedMegaDisplay = resolveMegaDisplayData({
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
  });

  const resolvedCrownDisplay = resolveCrownDisplayData({
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
  });

  const statsPokemon = {
    ...pokemon,
    type1_name: resolvedCrownDisplay.type1_name,
    type2_name: resolvedCrownDisplay.type2_name,
    type_1_icon: resolvedCrownDisplay.type_1_icon,
    type_2_icon: resolvedCrownDisplay.type_2_icon,
    sizes: resolvedCrownDisplay.sizes,
    instanceData: pokemon.instanceData,
  };

  const movesPokemon: CaughtMovesPreviewPokemon = {
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
  };

  const fusionMoveMeta: { source: FusionMoveSource; isFused: boolean } = {
    source: resolvedFusionMoves.source,
    isFused: Boolean(fusion.is_fused),
  };

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
