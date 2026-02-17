import type { PokemonInstance } from '@/types/pokemonInstance';
import {
  buildInstanceChanges,
  type FusionState,
  type IVs,
  type MegaData,
  type MovesState,
} from './buildInstanceChanges';

export type CaughtComputedValues = {
  cp?: number | null;
  level?: number | null;
  ivs?: IVs;
};

type ResolveCaughtPersistValuesArgs = {
  cp: string;
  level: number | null;
  ivs: IVs;
  newComputedValues: CaughtComputedValues;
};

type BuildCaughtPersistPatchMapArgs = {
  instanceId: string;
  nickname: string | null;
  isLucky: boolean;
  isFavorite: boolean;
  gender: string | null;
  weight: number | null;
  height: number | null;
  computedCP: number | null;
  computedLevel: number | null;
  computedIvs: IVs;
  moves: MovesState;
  locationCaught: string | null;
  dateCaught: string | null;
  selectedBackgroundId: number | null;
  megaData: MegaData;
  fusion: FusionState;
  isShadow: boolean;
  isPurified: boolean;
  maxAttack: string | number | '';
  maxGuard: string | number | '';
  maxSpirit: string | number | '';
  originalFusedWith: string | null;
};

export const resolveCaughtPersistValues = ({
  cp,
  level,
  ivs,
  newComputedValues,
}: ResolveCaughtPersistValuesArgs) => {
  const computedCP = newComputedValues.cp ?? (cp !== '' ? Number(cp) : null);
  const computedLevel = newComputedValues.level ?? level;
  const computedIvs = newComputedValues.ivs ?? ivs;
  return { computedCP, computedLevel, computedIvs };
};

export const buildCaughtPersistPatchMap = ({
  instanceId,
  nickname,
  isLucky,
  isFavorite,
  gender,
  weight,
  height,
  computedCP,
  computedLevel,
  computedIvs,
  moves,
  locationCaught,
  dateCaught,
  selectedBackgroundId,
  megaData,
  fusion,
  isShadow,
  isPurified,
  maxAttack,
  maxGuard,
  maxSpirit,
  originalFusedWith,
}: BuildCaughtPersistPatchMapArgs): Record<string, Partial<PokemonInstance>> => {
  const patchMap = buildInstanceChanges({
    instanceId,
    nickname,
    isLucky,
    isFavorite,
    gender,
    weight,
    height,
    computedCP,
    computedLevel,
    moves,
    ivs: computedIvs,
    locationCaught,
    dateCaught,
    selectedBackgroundId,
    megaData,
    fusion,
    isShadow,
    isPurified,
    maxAttack,
    maxGuard,
    maxSpirit,
  }) as Record<string, Partial<PokemonInstance>>;

  if (originalFusedWith && originalFusedWith !== fusion.fusedWith) {
    patchMap[originalFusedWith] = {
      disabled: false,
      fused_with: null,
      is_fused: false,
      fusion_form: null,
    };
  }

  if (fusion.fusedWith && fusion.is_fused && fusion.fusedWith !== originalFusedWith) {
    patchMap[fusion.fusedWith] = {
      disabled: true,
      fused_with: instanceId,
      is_fused: true,
      fusion_form: fusion.fusion_form,
    };
  }

  return patchMap;
};

