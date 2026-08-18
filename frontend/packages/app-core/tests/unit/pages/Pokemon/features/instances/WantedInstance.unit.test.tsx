import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WantedInstance from '@/pages/Pokemon/features/instances/WantedInstance';

const mocks = vi.hoisted(() => ({
  updateDetails: vi.fn(),
  alert: vi.fn(),
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (
    selector: (state: { updateInstanceDetails: typeof mocks.updateDetails }) => unknown,
  ) => selector({ updateInstanceDetails: mocks.updateDetails }),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ alert: mocks.alert }),
}));

vi.mock('@/utils/logger', () => ({
  createScopedLogger: () => mocks.logger,
}));

vi.mock('@/utils/imageHelpers', () => ({
  determineImageUrl: () => '/images/wanted.png',
}));

vi.mock('@/pages/Pokemon/features/instances/sections/HeaderRow', () => ({
  default: ({
    editMode,
    toggleEditMode,
    showCP,
    showFavorite,
    rightSlot,
  }: {
    editMode: boolean;
    toggleEditMode: () => void;
    showCP: boolean;
    showFavorite: boolean;
    rightSlot?: React.ReactNode;
  }) => (
    <div
      data-testid="header-row"
      data-show-cp={String(showCP)}
      data-show-favorite={String(showFavorite)}
    >
      <button type="button" onClick={toggleEditMode}>
        {editMode ? 'Save' : 'Edit'}
      </button>
      {rightSlot}
    </div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/sections/ImageStage', () => ({
  default: ({
    selectedBackground,
    dynamax,
    gigantamax,
    isLucky,
  }: {
    selectedBackground: { background_id: number } | null;
    dynamax: boolean;
    gigantamax: boolean;
    isLucky: boolean;
  }) => (
    <div
      data-testid="image-stage"
      data-background={selectedBackground?.background_id ?? 'none'}
      data-dynamax={String(dynamax)}
      data-gigantamax={String(gigantamax)}
      data-lucky={String(isLucky)}
    />
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/sections/IdentityRow', () => ({
  default: ({ eyebrow }: { eyebrow?: string }) => <div>{eyebrow}</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/StatsRow', () => ({
  default: ({ showTypes }: { showTypes: boolean }) => (
    <div data-testid="stats-row" data-show-types={String(showTypes)} />
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Wanted/FriendshipManager', () => ({
  default: ({
    friendship,
    setFriendship,
    setIsLucky,
    editMode,
  }: {
    friendship: number;
    setFriendship: (value: number) => void;
    setIsLucky: (value: boolean) => void;
    editMode: boolean;
  }) => (
    <div>
      <span>{friendship}/5 hearts</span>
      {editMode ? (
        <button
          type="button"
          onClick={() => {
            setFriendship(5);
            setIsLucky(true);
          }}
        >
          Require remote lucky trade
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: ({ onGenderChange }: { onGenderChange: (value: string) => void }) => (
    <button type="button" onClick={() => onGenderChange('Female')}>
      Set female
    </button>
  ),
}));

vi.mock('@/components/pokemonComponents/Moves', () => ({
  default: ({
    editMode,
    onMovesChange,
  }: {
    editMode: boolean;
    onMovesChange: (value: {
      fastMove: number;
      chargedMove1: number;
      chargedMove2: null;
    }) => void;
  }) =>
    editMode ? (
      <button
        type="button"
        onClick={() =>
          onMovesChange({ fastMove: 11, chargedMove1: 22, chargedMove2: null })
        }
      >
        Set desired moves
      </button>
    ) : null,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/TradeBackgroundModal', () => ({
  default: ({
    showBackgrounds,
    onSelectBackground,
  }: {
    showBackgrounds: boolean;
    onSelectBackground: (background: {
      background_id: number;
      image_url: string;
    }) => void;
  }) =>
    showBackgrounds ? (
      <button
        type="button"
        onClick={() =>
          onSelectBackground({ background_id: 7, image_url: '/images/bg.png' })
        }
      >
        Select Vancouver background
      </button>
    ) : null,
}));

const makePokemon = (overrides: Record<string, unknown> = {}) =>
  ({
    pokemon_id: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    variant_id: '0001-default',
    variantType: 'default',
    backgrounds: [
      {
        background_id: 7,
        image_url: '/images/bg.png',
        name: 'Vancouver',
        location: 'Vancouver',
        date: '',
        costume_id: 0,
      },
    ],
    moves: [],
    instanceData: {
      instance_id: 'wanted-instance-1',
      variant_id: '0001-default',
      nickname: null,
      gender: null,
      weight: null,
      height: null,
      fast_move_id: null,
      charged_move1_id: null,
      charged_move2_id: null,
      friendship_level: 3,
      pref_lucky: false,
      location_card: '7',
      dynamax: true,
      gigantamax: false,
      shadow: false,
      purified: false,
      ...overrides,
    },
  }) as any;

describe('WantedInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateDetails.mockResolvedValue(undefined);
    mocks.alert.mockResolvedValue(undefined);
  });

  it('uses the shared listing presentation while keeping wanted-only conditions', async () => {
    render(<WantedInstance pokemon={makePokemon()} isEditable compactListingView />);

    expect(document.querySelector('.wanted-instance--caught-layout')).not.toBeNull();
    expect(screen.getByText('Wanted')).toBeInTheDocument();
    const wantedConditions = screen.getByText('Wanted conditions').closest('section');
    const imageStage = screen.getByTestId('image-stage');
    expect(wantedConditions).not.toBeNull();
    if (!wantedConditions) throw new Error('Wanted conditions section was not rendered');
    expect(
      Boolean(wantedConditions.compareDocumentPosition(imageStage) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
    expect(document.querySelector('.wanted-instance__requirements')).toBeNull();
    expect(screen.getByTestId('header-row')).toHaveAttribute('data-show-cp', 'false');
    expect(screen.getByTestId('header-row')).toHaveAttribute('data-show-favorite', 'false');

    await waitFor(() => {
      expect(screen.getByTestId('image-stage')).toHaveAttribute('data-background', '7');
    });
    expect(screen.getByTestId('image-stage')).toHaveAttribute('data-dynamax', 'true');
  });

  it('edits and saves wanted conditions and Pokémon requirements together', async () => {
    const onPreviewInstanceDataChange = vi.fn();
    render(
      <WantedInstance
        pokemon={makePokemon()}
        isEditable
        onPreviewInstanceDataChange={onPreviewInstanceDataChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(document.querySelector('.wanted-instance__requirements')).not.toBeNull();
    expect(screen.getByTestId('stats-row')).toHaveAttribute('data-show-types', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Require remote lucky trade' }));
    expect(onPreviewInstanceDataChange).toHaveBeenLastCalledWith({ pref_lucky: true });
    fireEvent.click(screen.getByRole('button', { name: 'Set female' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set desired moves' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose special background' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Vancouver background' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.updateDetails).toHaveBeenCalledWith(
        'wanted-instance-1',
        expect.objectContaining({
          gender: 'Female',
          fast_move_id: 11,
          charged_move1_id: 22,
          friendship_level: 5,
          pref_lucky: true,
          location_card: '7',
        }),
      );
    });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('keeps edit mode open and reports a failed save', async () => {
    mocks.updateDetails.mockRejectedValueOnce(new Error('offline'));
    render(<WantedInstance pokemon={makePokemon()} isEditable />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.alert).toHaveBeenCalledWith(
        'An error occurred while updating the wanted Pokémon. Please try again.',
      );
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('keeps another trainer catalog view read-only and compact', () => {
    render(<WantedInstance pokemon={makePokemon()} isEditable={false} catalogView />);

    expect(document.querySelector('.wanted-instance--catalog-view')).not.toBeNull();
    expect(screen.queryByTestId('header-row')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByText('Wanted')).toBeInTheDocument();
    expect(screen.getByText('3/5 hearts')).toBeInTheDocument();
  });

  it('reveals only meaningful desired details outside edit mode', () => {
    const { rerender } = render(
      <WantedInstance
        pokemon={makePokemon({ gender: 'Any' })}
        isEditable={false}
        catalogView
      />,
    );
    expect(document.querySelector('.wanted-instance__requirements')).toBeNull();

    rerender(
      <WantedInstance
        key="specific-wanted"
        pokemon={makePokemon({ gender: 'Female', weight: 6.9 })}
        isEditable={false}
        catalogView
      />,
    );
    expect(document.querySelector('.wanted-instance__requirements')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Set female' })).toBeInTheDocument();
    expect(screen.getByTestId('stats-row')).toHaveAttribute('data-show-types', 'false');
  });
});
