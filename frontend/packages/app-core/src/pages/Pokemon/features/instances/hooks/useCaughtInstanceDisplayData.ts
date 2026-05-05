import { useMemo } from 'react';

import {
  buildCaughtPokemonDisplayModel,
  type CaughtPokemonDisplayModelArgs,
} from '@/features/pokemonDisplay/caughtPokemonDisplayModel';

export const useCaughtInstanceDisplayData = ({
  pokemon,
  variants,
  fusion,
  megaData,
  crownData,
  moves,
}: CaughtPokemonDisplayModelArgs) => {
  const { is_fused, fusion_form, storedFusionObject } = fusion;
  const { isMega, megaForm } = megaData;
  const { isCrown, crownForm } = crownData;
  const { fastMove, chargedMove1, chargedMove2 } = moves;

  return useMemo(
    () =>
      buildCaughtPokemonDisplayModel({
        pokemon,
        variants,
        fusion: {
          is_fused,
          fusion_form,
          storedFusionObject,
        },
        megaData: {
          isMega,
          megaForm,
        },
        crownData: {
          isCrown,
          crownForm,
        },
        moves: {
          fastMove,
          chargedMove1,
          chargedMove2,
        },
      }),
    [
      chargedMove1,
      chargedMove2,
      crownForm,
      fastMove,
      fusion_form,
      isCrown,
      isMega,
      is_fused,
      megaForm,
      pokemon,
      storedFusionObject,
      variants,
    ],
  );
};
