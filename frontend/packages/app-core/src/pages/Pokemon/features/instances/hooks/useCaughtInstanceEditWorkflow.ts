import { useCallback, useState } from 'react';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import type { BaseStats } from '@/types/cp';

import {
  type CaughtComputedValues,
  buildCaughtPersistPatchMap,
  resolveCaughtPersistValues,
} from '../utils/caughtPersist';
import type {
  FusionState,
  IVs,
  MegaData,
  MovesState,
} from '../utils/buildInstanceChanges';
import {
  useEditWorkflow,
  type EditWorkflowComputed,
  type EditWorkflowPayload,
} from './useEditWorkflow';

type ValidateCaughtInstance = (
  fields: {
    level?: number | string;
    cp?: number | string;
    ivs?: {
      Attack?: number;
      Defense?: number;
      Stamina?: number;
    };
  },
  baseStats: BaseStats,
) => {
  validationErrors: {
    level?: string;
    cp?: string;
    ivs?: string;
    general?: string;
  };
  computedValues: CaughtComputedValues;
};

type UseCaughtInstanceEditWorkflowArgs = {
  instanceId: string;
  currentBaseStats: BaseStats;
  alert: (message: string) => void | Promise<void>;
  validate: ValidateCaughtInstance;
  resetErrors: () => void;
  recalcArcHeight: () => void;
  applyComputedValues: (newComputedValues: CaughtComputedValues) => void;
  cp: string;
  level: number | null;
  ivs: IVs;
  weight: number;
  height: number;
  nickname: string | null;
  isLucky: boolean;
  isTraded: boolean;
  isFavorite: boolean;
  gender: string | null;
  moves: MovesState;
  locationCaught: string | null;
  dateCaught: string | null;
  originalTrainerName: string | null;
  originalTrainerId: string | null;
  tradedDate: string | null;
  pokeball: string | null;
  selectedBackgroundId: number | null;
  megaData: MegaData;
  crown: boolean;
  fusion: FusionState;
  isShadow: boolean;
  isPurified: boolean;
  maxAttack: string | number | '';
  maxGuard: string | number | '';
  maxSpirit: string | number | '';
};

export const useCaughtInstanceEditWorkflow = ({
  instanceId,
  currentBaseStats,
  alert,
  validate,
  resetErrors,
  recalcArcHeight,
  applyComputedValues,
  cp,
  level,
  ivs,
  weight,
  height,
  nickname,
  isLucky,
  isTraded,
  isFavorite,
  gender,
  moves,
  locationCaught,
  dateCaught,
  originalTrainerName,
  originalTrainerId,
  tradedDate,
  pokeball,
  selectedBackgroundId,
  megaData,
  crown,
  fusion,
  isShadow,
  isPurified,
  maxAttack,
  maxGuard,
  maxSpirit,
}: UseCaughtInstanceEditWorkflowArgs) => {
  const updateDetails = useInstancesStore((state) => state.updateInstanceDetails);
  const [originalFusedWith, setOriginalFusedWith] = useState<string | null>(
    fusion.fusedWith ?? null,
  );

  const validateEditablePayload = useCallback(
    (payload: EditWorkflowPayload, baseStats: unknown) => {
      const result = validate(
        {
          level: payload.level ?? undefined,
          cp: payload.cp ?? undefined,
          ivs: {
            Attack: payload.ivs.Attack === '' ? undefined : payload.ivs.Attack,
            Defense: payload.ivs.Defense === '' ? undefined : payload.ivs.Defense,
            Stamina: payload.ivs.Stamina === '' ? undefined : payload.ivs.Stamina,
          },
        },
        baseStats as BaseStats,
      );

      return {
        validationErrors: result.validationErrors as Record<string, string | undefined>,
        computedValues: result.computedValues as EditWorkflowComputed,
      };
    },
    [validate],
  );

  const handlePersist = useCallback(
    async ({ newComputedValues }: { newComputedValues: EditWorkflowComputed }) => {
      const computedValues = newComputedValues as CaughtComputedValues;
      const { computedCP, computedLevel, computedIvs } = resolveCaughtPersistValues({
        cp,
        level,
        ivs,
        newComputedValues: computedValues,
      });
      applyComputedValues(computedValues);

      const patchMap = buildCaughtPersistPatchMap({
        instanceId,
        nickname,
        isLucky,
        isTraded,
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
        originalTrainerName,
        originalTrainerId,
        tradedDate,
        pokeball,
        selectedBackgroundId,
        megaData,
        crown,
        fusion,
        isShadow,
        isPurified,
        maxAttack,
        maxGuard,
        maxSpirit,
        originalFusedWith,
        allInstances: useInstancesStore.getState().instances,
      });

      await updateDetails(patchMap);
      resetErrors();
      recalcArcHeight();
    },
    [
      applyComputedValues,
      cp,
      crown,
      dateCaught,
      fusion,
      gender,
      height,
      instanceId,
      isFavorite,
      isLucky,
      isPurified,
      isShadow,
      isTraded,
      ivs,
      level,
      locationCaught,
      maxAttack,
      maxGuard,
      maxSpirit,
      megaData,
      moves,
      nickname,
      originalFusedWith,
      originalTrainerId,
      originalTrainerName,
      pokeball,
      recalcArcHeight,
      resetErrors,
      selectedBackgroundId,
      tradedDate,
      updateDetails,
      weight,
    ],
  );

  const handleStartEditing = useCallback(() => {
    setOriginalFusedWith(fusion.fusedWith ?? null);
  }, [fusion.fusedWith]);

  const { editMode, toggleEditMode } = useEditWorkflow({
    validate: validateEditablePayload,
    currentBaseStats,
    alert,
    onPersist: handlePersist,
    onStartEditing: handleStartEditing,
  });

  const handleToggleEditClick = useCallback(async () => {
    await toggleEditMode({
      level,
      cp: cp !== '' ? Number(cp) : null,
      ivs,
      weight,
      height,
    });
  }, [toggleEditMode, level, cp, ivs, weight, height]);

  return {
    editMode,
    handleToggleEditClick,
  };
};
