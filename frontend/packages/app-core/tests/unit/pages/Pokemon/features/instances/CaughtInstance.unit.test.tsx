import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CaughtInstance from '@/pages/Pokemon/features/instances/CaughtInstance';
import type { PokemonInstance } from '@/types/pokemonInstance';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  handleBackgroundSelect: vi.fn(),
  handleFuseProceed: vi.fn(),
  handleFusionToggle: vi.fn(),
  handleUndoFusion: vi.fn(),
  resetErrors: vi.fn(),
  setFusion: vi.fn(),
  setShowBackgrounds: vi.fn(),
  toggleEditMode: vi.fn(async () => true),
  updateInstanceDetails: vi.fn(async () => undefined),
  validate: vi.fn(() => ({
    validationErrors: {},
    computedValues: {},
  })),
  editMode: false,
  instances: {} as Record<string, PokemonInstance>,
  foreignInstances: {} as Record<string, PokemonInstance>,
  variants: [] as unknown[],
  selectedBackground: null as { background_id: number; image_url?: string } | null,
  selectableBackgrounds: [{ background_id: 2, image_url: '/images/bg-2.png' }],
  fusion: {
    is_fused: false,
    fusedWith: null,
    fusion_form: null,
    storedFusionObject: null,
    overlayCandidates: [],
    overlayPokemon: null,
  },
}));

vi.mock('@/features/instances/store/useInstancesStore', () => {
  const useInstancesStore = (selector: (state: unknown) => unknown) =>
    selector({
      instances: mocks.instances,
      foreignInstances: mocks.foreignInstances,
      updateInstanceDetails: mocks.updateInstanceDetails,
    });
  useInstancesStore.getState = () => ({
    instances: mocks.instances,
    foreignInstances: mocks.foreignInstances,
    updateInstanceDetails: mocks.updateInstanceDetails,
  });
  return { useInstancesStore };
});

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: unknown) => unknown) =>
    selector({
      variants: mocks.variants,
    }),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({
    alert: mocks.alert,
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useValidation', () => ({
  default: () => ({
    validate: mocks.validate,
    resetErrors: mocks.resetErrors,
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useFusion', () => ({
  useFusion: () => ({
    fusion: mocks.fusion,
    setFusion: mocks.setFusion,
    handleFuseProceed: mocks.handleFuseProceed,
    handleFusionToggle: mocks.handleFusionToggle,
    handleUndoFusion: mocks.handleUndoFusion,
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useBackgrounds', () => ({
  useBackgrounds: () => ({
    showBackgrounds: false,
    setShowBackgrounds: mocks.setShowBackgrounds,
    selectedBackground: mocks.selectedBackground,
    handleBackgroundSelect: mocks.handleBackgroundSelect,
    selectableBackgrounds: mocks.selectableBackgrounds,
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useSprite', () => ({
  useSprite: () => '/images/rendered-sprite.png',
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useCalculatedCP', () => ({
  useCalculatedCP: () => undefined,
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useArcHeight', () => ({
  useArcHeight: () => ({
    arcLayerRef: { current: null },
    recalcArcHeight: vi.fn(),
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useEditWorkflow', () => ({
  useEditWorkflow: () => ({
    editMode: mocks.editMode,
    toggleEditMode: mocks.toggleEditMode,
    setEditMode: vi.fn(),
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/sections/PowerPanel', () => ({
  default: ({
    editMode,
    maxAttack,
    maxGuard,
    maxSpirit,
  }: {
    editMode: boolean;
    maxAttack: string;
    maxGuard: string;
    maxSpirit: string;
  }) => (
    <div
      data-testid="power-panel"
      data-edit-mode={String(editMode)}
      data-max-values={`${maxAttack}:${maxGuard}:${maxSpirit}`}
    />
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/sections/Modals', () => ({
  default: ({ showBackgrounds }: { showBackgrounds: boolean }) => (
    <div data-testid="caught-modals" data-show-backgrounds={String(showBackgrounds)} />
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/FusionComponent', () => ({
  default: ({ editMode }: { editMode: boolean }) => (
    <div data-testid="fusion-component" data-edit-mode={String(editMode)} />
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/sections/InstanceDetailsLayout', () => ({
  default: (props: Record<string, any>) => (
    <div
      data-testid="caught-layout"
      data-date-caught={props.dateCaught ?? ''}
      data-cp={props.headerRow.cp}
      data-favorite={String(props.headerRow.isFavorite)}
      data-background-count={String(props.backgroundSelector.canPick ? 1 : 0)}
      data-level={String(props.levelArcLevel ?? '')}
      data-image={props.imageStage.currentImage}
      data-background-id={String(props.imageStage.selectedBackground?.background_id ?? '')}
      data-lucky={String(props.imageStage.isLucky)}
      data-shadow={String(props.identityRow.isShadow)}
      data-purified={String(props.identityRow.isPurified)}
      data-pokeball={props.metaPanel.pokeball ?? ''}
      data-show-stats-divider={String(props.showStatsDivider)}
      data-show-power-divider={String(props.showPowerDivider)}
      data-show-meta-panel={String(props.showMetaPanel)}
      data-show-meta-divider={String(props.showMetaDivider)}
      data-ivs-empty={String(props.movesAndIV.areIVsEmpty)}
    >
      <button type="button" onClick={() => props.headerRow.onCPChange('1200')}>
        change-cp
      </button>
      <button type="button" onClick={() => props.headerRow.toggleEditMode()}>
        toggle-edit
      </button>
      <button type="button" onClick={() => props.identityRow.onToggleLucky(true)}>
        toggle-lucky
      </button>
      <button type="button" onClick={() => props.identityRow.onTogglePurify(true)}>
        purify
      </button>
      <button type="button" onClick={() => props.metaPanel.onPokeballChange('ultra_ball')}>
        change-ball
      </button>
      {props.powerContent}
      {props.postPowerContent}
      {props.footerContent}
    </div>
  ),
}));

const makePokemon = (instanceOverrides: Partial<PokemonInstance> = {}) =>
  ({
    pokemon_id: 25,
    name: 'Pikachu',
    species_name: 'Pikachu',
    variant_id: '0025-default',
    variantType: 'default',
    image_url: '/images/pikachu.png',
    image_url_shiny: '/images/pikachu-shiny.png',
    image_url_shadow: '/images/pikachu-shadow.png',
    image_url_shiny_shadow: '/images/pikachu-shiny-shadow.png',
    currentImage: '/images/pikachu.png',
    attack: 112,
    defense: 96,
    stamina: 111,
    moves: [
      { move_id: 1, name: 'Thunder Shock', is_fast: 1 },
      { move_id: 2, name: 'Thunderbolt', is_fast: 0 },
    ],
    backgrounds: [
      {
        background_id: 2,
        image_url: '/images/bg-2.png',
        name: 'Seattle',
      },
    ],
    megaEvolutions: [],
    crownForms: [],
    fusion: [],
    max: [],
    instanceData: {
      instance_id: 'instance-25',
      pokemon_id: 25,
      variant_id: '0025-default',
      cp: 500,
      favorite: true,
      gender: 'Female',
      level: 20,
      attack_iv: 10,
      defense_iv: 11,
      stamina_iv: 12,
      weight: 6,
      height: 0.4,
      location_card: '2',
      location_caught: 'Seattle',
      date_caught: '2026-02-17',
      pokeball: 'poke_ball',
      lucky: false,
      shadow: false,
      purified: false,
      is_traded: false,
      max_attack: 1,
      max_guard: 2,
      max_spirit: 3,
      ...instanceOverrides,
    },
  }) as unknown as React.ComponentProps<typeof CaughtInstance>['pokemon'];

describe('CaughtInstance', () => {
  beforeEach(() => {
    mocks.alert.mockClear();
    mocks.handleBackgroundSelect.mockClear();
    mocks.handleFuseProceed.mockClear();
    mocks.handleFusionToggle.mockClear();
    mocks.handleUndoFusion.mockClear();
    mocks.resetErrors.mockClear();
    mocks.setFusion.mockClear();
    mocks.setShowBackgrounds.mockClear();
    mocks.toggleEditMode.mockClear();
    mocks.updateInstanceDetails.mockClear();
    mocks.validate.mockClear();
    mocks.editMode = false;
    mocks.instances = {};
    mocks.foreignInstances = {};
    mocks.variants = [];
    mocks.selectedBackground = null;
    mocks.selectableBackgrounds = [{ background_id: 2, image_url: '/images/bg-2.png' }];
    mocks.fusion = {
      is_fused: false,
      fusedWith: null,
      fusion_form: null,
      storedFusionObject: null,
      overlayCandidates: [],
      overlayPokemon: null,
    };
  });

  it('wires caught instance state into the shared details layout', async () => {
    const onPreviewInstanceDataChange = vi.fn();

    render(
      <CaughtInstance
        pokemon={makePokemon()}
        isEditable={true}
        onPreviewInstanceDataChange={onPreviewInstanceDataChange}
        activeInstanceIdHint="instance-25"
      />,
    );

    const layout = screen.getByTestId('caught-layout');

    expect(layout).toHaveAttribute('data-date-caught', '2026-02-17');
    expect(layout).toHaveAttribute('data-cp', '500');
    expect(layout).toHaveAttribute('data-favorite', 'true');
    expect(layout).toHaveAttribute('data-level', '20');
    expect(layout).toHaveAttribute('data-image', '/images/rendered-sprite.png');
    expect(layout).toHaveAttribute('data-background-id', '2');
    expect(layout).toHaveAttribute('data-pokeball', 'poke_ball');
    expect(layout).toHaveAttribute('data-ivs-empty', 'false');
    expect(screen.getByTestId('power-panel')).toHaveAttribute('data-max-values', '1:2:3');

    await waitFor(() =>
      expect(onPreviewInstanceDataChange).toHaveBeenCalledWith({
        shadow: false,
        purified: false,
        lucky: false,
      }),
    );
  });

  it('pushes immediate preview state when caught power toggles change background-affecting flags', async () => {
    const onPreviewInstanceDataChange = vi.fn();

    render(
      <CaughtInstance
        pokemon={makePokemon({ shadow: true, purified: false, lucky: false })}
        isEditable={true}
        onPreviewInstanceDataChange={onPreviewInstanceDataChange}
      />,
    );

    await waitFor(() =>
      expect(onPreviewInstanceDataChange).toHaveBeenCalledWith({
        shadow: true,
        purified: false,
        lucky: false,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'purify' }));

    await waitFor(() => {
      expect(screen.getByTestId('caught-layout')).toHaveAttribute('data-shadow', 'false');
      expect(screen.getByTestId('caught-layout')).toHaveAttribute('data-purified', 'true');
      expect(onPreviewInstanceDataChange).toHaveBeenCalledWith({
        shadow: false,
        purified: true,
        lucky: false,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'toggle-lucky' }));

    await waitFor(() =>
      expect(onPreviewInstanceDataChange).toHaveBeenCalledWith({
        shadow: false,
        purified: true,
        lucky: true,
      }),
    );
  });

  it('uses current editable caught fields when toggling edit workflow', async () => {
    render(<CaughtInstance pokemon={makePokemon()} isEditable={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'change-cp' }));

    await waitFor(() =>
      expect(screen.getByTestId('caught-layout')).toHaveAttribute('data-cp', '1200'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle-edit' }));

    await waitFor(() =>
      expect(mocks.toggleEditMode).toHaveBeenCalledWith({
        cp: 1200,
        height: 0.4,
        ivs: {
          Attack: 10,
          Defense: 11,
          Stamina: 12,
        },
        level: 20,
        weight: 6,
      }),
    );
  });

  it('omits sparse read-only meta panel and shows it once metadata is edited locally', async () => {
    render(
      <CaughtInstance
        pokemon={makePokemon({
          location_caught: '',
          date_caught: null,
          original_trainer_name: null,
          original_trainer_id: null,
          traded_date: null,
          pokeball: null,
        })}
        isEditable={true}
      />,
    );

    expect(screen.getByTestId('caught-layout')).toHaveAttribute('data-show-meta-panel', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'change-ball' }));

    await waitFor(() => {
      expect(screen.getByTestId('caught-layout')).toHaveAttribute('data-pokeball', 'ultra_ball');
      expect(screen.getByTestId('caught-layout')).toHaveAttribute('data-show-meta-panel', 'true');
    });
  });
});
