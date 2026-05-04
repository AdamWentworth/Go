import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCaughtInstanceEditWorkflow } from '@/pages/Pokemon/features/instances/hooks/useCaughtInstanceEditWorkflow';
import type { PokemonInstance } from '@/types/pokemonInstance';

const mocks = vi.hoisted(() => ({
  instances: {} as Record<string, Partial<PokemonInstance>>,
  updateDetails: vi.fn(async () => undefined),
}));

vi.mock('@/features/instances/store/useInstancesStore', () => {
  const useInstancesStore = <T,>(
    selector: (state: {
      instances: Record<string, Partial<PokemonInstance>>;
      updateInstanceDetails: typeof mocks.updateDetails;
    }) => T,
  ) =>
    selector({
      instances: mocks.instances,
      updateInstanceDetails: mocks.updateDetails,
    });

  useInstancesStore.getState = () => ({
    instances: mocks.instances,
    updateInstanceDetails: mocks.updateDetails,
  });

  return { useInstancesStore };
});

type HookArgs = Parameters<typeof useCaughtInstanceEditWorkflow>[0];

const computedValues = {
  cp: 777,
  level: 35,
  ivs: { Attack: 14, Defense: 13, Stamina: 12 },
};

const makeArgs = (overrides: Partial<HookArgs> = {}): HookArgs => ({
  instanceId: 'instance-25',
  currentBaseStats: { attack: 112, defense: 96, stamina: 111 },
  alert: vi.fn(),
  validate: vi.fn(() => ({
    validationErrors: {},
    computedValues,
  })),
  resetErrors: vi.fn(),
  recalcArcHeight: vi.fn(),
  applyComputedValues: vi.fn(),
  cp: '500',
  level: 20,
  ivs: { Attack: 10, Defense: 11, Stamina: 12 },
  weight: 6,
  height: 0.4,
  nickname: 'Sparky',
  isLucky: true,
  isTraded: true,
  isFavorite: true,
  gender: 'Female',
  moves: { fastMove: 1, chargedMove1: 2, chargedMove2: null },
  locationCaught: 'Seattle',
  dateCaught: '2026-02-17',
  originalTrainerName: 'Misty',
  originalTrainerId: '1234',
  tradedDate: '2026-03-01',
  pokeball: 'ultra_ball',
  selectedBackgroundId: 4,
  megaData: { isMega: false, mega: false, megaForm: null },
  crown: false,
  fusion: {
    storedFusionObject: null,
    is_fused: false,
    fusedWith: null,
    fusion_form: null,
  },
  isShadow: false,
  isPurified: false,
  maxAttack: '',
  maxGuard: '',
  maxSpirit: '',
  ...overrides,
});

describe('useCaughtInstanceEditWorkflow', () => {
  beforeEach(() => {
    mocks.instances = {};
    mocks.updateDetails.mockClear();
  });

  it('validates and persists the current caught form state when saving edits', async () => {
    const args = makeArgs();

    const { result } = renderHook(() => useCaughtInstanceEditWorkflow(args));

    await act(async () => {
      await result.current.handleToggleEditClick();
    });
    expect(result.current.editMode).toBe(true);
    expect(mocks.updateDetails).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleToggleEditClick();
    });

    expect(args.validate).toHaveBeenCalledWith(
      {
        level: 20,
        cp: 500,
        ivs: { Attack: 10, Defense: 11, Stamina: 12 },
      },
      args.currentBaseStats,
    );
    expect(args.applyComputedValues).toHaveBeenCalledWith(computedValues);
    expect(mocks.updateDetails).toHaveBeenCalledWith({
      'instance-25': expect.objectContaining({
        nickname: 'Sparky',
        cp: 777,
        level: 35,
        attack_iv: 14,
        defense_iv: 13,
        stamina_iv: 12,
        location_card: '4',
        lucky: true,
        is_traded: true,
        fast_move_id: 1,
        charged_move1_id: 2,
        charged_move2_id: null,
      }),
    });
    expect(args.resetErrors).toHaveBeenCalledTimes(1);
    expect(args.recalcArcHeight).toHaveBeenCalledTimes(1);
    expect(result.current.editMode).toBe(false);
  });

  it('keeps edit mode open and does not persist when validation fails', async () => {
    const args = makeArgs({
      validate: vi.fn(() => ({
        validationErrors: { level: 'Level is not valid.' },
        computedValues: {},
      })),
    });

    const { result } = renderHook(() => useCaughtInstanceEditWorkflow(args));

    await act(async () => {
      await result.current.handleToggleEditClick();
    });
    await act(async () => {
      await result.current.handleToggleEditClick();
    });

    expect(args.alert).toHaveBeenCalledWith('Level is not valid.');
    expect(mocks.updateDetails).not.toHaveBeenCalled();
    expect(args.applyComputedValues).not.toHaveBeenCalled();
    expect(args.resetErrors).not.toHaveBeenCalled();
    expect(args.recalcArcHeight).not.toHaveBeenCalled();
    expect(result.current.editMode).toBe(true);
  });

  it('releases the original fusion partner and disables the new partner when fusion changes during edit', async () => {
    mocks.instances = {
      oldPartnerKey: {
        instance_id: 'old-partner',
        disabled: true,
        fused_with: 'instance-25',
        is_fused: true,
      },
      newPartnerKey: {
        instance_id: 'new-partner',
        disabled: false,
      },
    };

    const initialArgs = makeArgs({
      fusion: {
        storedFusionObject: null,
        is_fused: true,
        fusedWith: 'old-partner',
        fusion_form: 'Dawn Wings',
      },
    });
    const nextArgs = makeArgs({
      fusion: {
        storedFusionObject: null,
        is_fused: true,
        fusedWith: 'new-partner',
        fusion_form: 'Dawn Wings',
      },
    });

    const { result, rerender } = renderHook(
      (props: HookArgs) => useCaughtInstanceEditWorkflow(props),
      { initialProps: initialArgs },
    );

    await act(async () => {
      await result.current.handleToggleEditClick();
    });

    rerender(nextArgs);

    await act(async () => {
      await result.current.handleToggleEditClick();
    });

    expect(mocks.updateDetails).toHaveBeenCalledWith({
      'instance-25': expect.objectContaining({
        is_fused: true,
        fused_with: 'new-partner',
        fusion_form: 'Dawn Wings',
      }),
      oldPartnerKey: {
        disabled: false,
        fused_with: null,
        is_fused: false,
        fusion_form: null,
      },
      newPartnerKey: {
        disabled: true,
        fused_with: 'instance-25',
        is_fused: true,
        fusion_form: 'Dawn Wings',
      },
    });
  });
});
