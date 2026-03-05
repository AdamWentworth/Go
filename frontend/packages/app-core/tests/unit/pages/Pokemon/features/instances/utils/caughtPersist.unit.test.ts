import { describe, expect, it } from 'vitest';

import {
  buildCaughtPersistPatchMap,
  resolveCaughtPersistValues,
} from '@/pages/Pokemon/features/instances/utils/caughtPersist';
import type { FusionState, IVs, MegaData, MovesState } from '@/pages/Pokemon/features/instances/utils/buildInstanceChanges';

const baseIvs: IVs = { Attack: 1, Defense: 2, Stamina: 3 };
const baseMoves: MovesState = { fastMove: 1, chargedMove1: 2, chargedMove2: 3 };
const baseMega: MegaData = { isMega: false, mega: false, megaForm: null };
const baseFusion: FusionState = {
  storedFusionObject: null,
  is_fused: false,
  fusedWith: null,
  fusion_form: null,
};

describe('caughtPersist utils', () => {
  it('resolves computed values with computed overrides', () => {
    const result = resolveCaughtPersistValues({
      cp: '777',
      level: 20,
      ivs: baseIvs,
      newComputedValues: {
        cp: 111,
        level: 44,
        ivs: { Attack: 10, Defense: 11, Stamina: 12 },
      },
    });

    expect(result).toEqual({
      computedCP: 111,
      computedLevel: 44,
      computedIvs: { Attack: 10, Defense: 11, Stamina: 12 },
    });
  });

  it('resolves computed values with fallback to current state', () => {
    const result = resolveCaughtPersistValues({
      cp: '',
      level: 20,
      ivs: baseIvs,
      newComputedValues: {},
    });

    expect(result).toEqual({
      computedCP: null,
      computedLevel: 20,
      computedIvs: baseIvs,
    });
  });

  it('builds patch map and handles fusion link transitions', () => {
    const patchMap = buildCaughtPersistPatchMap({
      instanceId: 'current',
      nickname: 'Sparky',
      isLucky: false,
      isTraded: true,
      isFavorite: true,
      gender: 'Female',
      weight: 5.5,
      height: 0.5,
      computedCP: 1234,
      computedLevel: 35,
      computedIvs: { Attack: 15, Defense: 14, Stamina: 13 },
      moves: baseMoves,
      locationCaught: 'Seattle',
      dateCaught: '2026-02-17',
      originalTrainerName: 'Trainer Silver',
      originalTrainerId: 'user-999',
      tradedDate: '2026-02-18',
      pokeball: 'ultra_ball',
      selectedBackgroundId: 7,
      megaData: baseMega,
      fusion: {
        ...baseFusion,
        is_fused: true,
        fusedWith: 'new-fused',
        fusion_form: 'Sun',
      },
      isShadow: false,
      isPurified: false,
      maxAttack: '',
      maxGuard: '2',
      maxSpirit: '3',
      originalFusedWith: 'old-fused',
    });

    expect(patchMap.current).toMatchObject({
      cp: 1234,
      level: 35,
      is_traded: true,
      location_card: '7',
      pokeball: 'ultra_ball',
      original_trainer_name: 'Trainer Silver',
      original_trainer_id: 'user-999',
      traded_date: '2026-02-18',
      fusion_form: 'Sun',
      fused_with: 'new-fused',
      max_attack: null,
      max_guard: 2,
      max_spirit: 3,
    });

    expect(patchMap['old-fused']).toEqual({
      disabled: false,
      fused_with: null,
      is_fused: false,
      fusion_form: null,
    });

    expect(patchMap['new-fused']).toEqual({
      disabled: true,
      fused_with: 'current',
      is_fused: true,
      fusion_form: 'Sun',
    });
  });

  it('auto-releases linked partner rows when unfusing with missing originalFusedWith', () => {
    const patchMap = buildCaughtPersistPatchMap({
      instanceId: 'open-instance-id',
      nickname: null,
      isLucky: false,
      isTraded: false,
      isFavorite: false,
      gender: null,
      weight: null,
      height: null,
      computedCP: null,
      computedLevel: null,
      computedIvs: baseIvs,
      moves: baseMoves,
      locationCaught: null,
      dateCaught: null,
      originalTrainerName: null,
      originalTrainerId: null,
      tradedDate: null,
      pokeball: null,
      selectedBackgroundId: null,
      megaData: baseMega,
      fusion: {
        ...baseFusion,
        is_fused: false,
        fusedWith: null,
        fusion_form: null,
      },
      isShadow: false,
      isPurified: false,
      maxAttack: '',
      maxGuard: '',
      maxSpirit: '',
      originalFusedWith: null,
      allInstances: {
        partnerKey: {
          instance_id: 'partner-instance-id',
          fused_with: 'open-instance-id',
          is_fused: true,
          disabled: true,
          fusion_form: 'Dusk Mane Necrozma',
        } as Partial<import('@/types/pokemonInstance').PokemonInstance>,
        openKey: {
          instance_id: 'open-instance-id',
          is_fused: true,
          fusion_form: 'Dusk Mane Necrozma',
        } as Partial<import('@/types/pokemonInstance').PokemonInstance>,
      },
    });

    expect(patchMap.partnerKey).toEqual({
      disabled: false,
      fused_with: null,
      is_fused: false,
      fusion_form: null,
    });
  });

  it('resolves originalFusedWith uuid to legacy-prefixed partner key on release', () => {
    const partnerUuid = '79094536-4eec-4736-bcc7-e440d188eee5';
    const patchMap = buildCaughtPersistPatchMap({
      instanceId: 'open-instance-id',
      nickname: null,
      isLucky: false,
      isTraded: false,
      isFavorite: false,
      gender: null,
      weight: null,
      height: null,
      computedCP: null,
      computedLevel: null,
      computedIvs: baseIvs,
      moves: baseMoves,
      locationCaught: null,
      dateCaught: null,
      originalTrainerName: null,
      originalTrainerId: null,
      tradedDate: null,
      pokeball: null,
      selectedBackgroundId: null,
      megaData: baseMega,
      fusion: {
        ...baseFusion,
        is_fused: false,
        fusedWith: null,
        fusion_form: null,
      },
      isShadow: false,
      isPurified: false,
      maxAttack: '',
      maxGuard: '',
      maxSpirit: '',
      originalFusedWith: partnerUuid,
      allInstances: {
        [`0791-default_${partnerUuid}`]: {
          instance_id: `0791-default_${partnerUuid}`,
          is_fused: true,
          disabled: true,
          fusion_form: 'Dusk Mane Necrozma',
        } as Partial<import('@/types/pokemonInstance').PokemonInstance>,
      },
    });

    expect(patchMap[`0791-default_${partnerUuid}`]).toEqual({
      disabled: false,
      fused_with: null,
      is_fused: false,
      fusion_form: null,
    });
    expect(patchMap[partnerUuid]).toBeUndefined();
  });
});
