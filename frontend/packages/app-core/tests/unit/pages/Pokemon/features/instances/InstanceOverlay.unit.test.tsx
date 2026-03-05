import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InstanceOverlay from '@/pages/Pokemon/features/instances/InstanceOverlay';

vi.mock('@/components/OverlayPortal', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="overlay-portal">{children}</div>
  ),
}));

vi.mock('@/components/WindowOverlay', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="window-overlay">{children}</div>
  ),
}));

vi.mock('@/components/CloseButton', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/CaughtInstance', () => ({
  default: ({
    pokemon,
    onPreviewInstanceDataChange,
  }: {
    pokemon: { instanceData?: { original_trainer_name?: string | null } };
    onPreviewInstanceDataChange?: (patch: {
      shadow?: boolean;
      purified?: boolean;
      lucky?: boolean;
    }) => void;
  }) => (
    <div data-testid="caught-instance">
      {pokemon.instanceData?.original_trainer_name ?? 'none'}
      <button
        type="button"
        onClick={() => onPreviewInstanceDataChange?.({ shadow: false, purified: true, lucky: false })}
      >
        preview-purified
      </button>
    </div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/TradeInstance', () => ({
  default: () => <div data-testid="trade-instance" />,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeDetails', () => ({
  default: () => <div data-testid="trade-details" />,
}));

vi.mock('@/pages/Pokemon/features/instances/WantedInstance', () => ({
  default: () => <div data-testid="wanted-instance" />,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Wanted/WantedDetails', () => ({
  default: () => <div data-testid="wanted-details" />,
}));

function makePokemon(overrides: Record<string, unknown> = {}) {
  return {
    pokemon_id: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    variant_id: '0001-default',
    variantType: 'default',
    currentImage: '/images/1.png',
    image_url: '/images/1.png',
    image_url_shadow: '/images/1-shadow.png',
    image_url_shiny: '/images/1-shiny.png',
    image_url_shiny_shadow: '/images/1-shiny-shadow.png',
    instanceData: {},
    costumes: [],
    ...overrides,
  } as unknown as React.ComponentProps<typeof InstanceOverlay>['pokemon'];
}

function renderOverlay(
  tagFilter: string,
  pokemonOverrides: Record<string, unknown> = {},
) {
  render(
    <InstanceOverlay
      pokemon={makePokemon(pokemonOverrides)}
      onClose={vi.fn()}
      variants={[]}
      tagFilter={tagFilter}
      lists={{}}
      instances={{}}
      sortType="name"
      sortMode="ascending"
      isEditable={true}
      username="ash"
    />,
  );
}

describe('InstanceOverlay', () => {
  it('renders caught overlay when tag filter is caught', () => {
    renderOverlay('caught');
    expect(screen.getByTestId('caught-instance')).toBeInTheDocument();
  });

  it('renders trade overlay windows when tag filter is trade', () => {
    renderOverlay('trade');
    expect(screen.getByTestId('trade-instance')).toBeInTheDocument();
    expect(screen.getByTestId('trade-details')).toBeInTheDocument();
  });

  it('falls back to pokemon status when tag filter is unknown', () => {
    renderOverlay('unknown-filter', {
      instanceData: { status: 'wanted' },
    });
    expect(screen.getByTestId('wanted-details')).toBeInTheDocument();
    expect(screen.getByTestId('wanted-instance')).toBeInTheDocument();
  });

  it('uses non-shadow type background for purified pokemon even when shadow flag exists', () => {
    renderOverlay('caught', {
      type1_name: 'Psychic',
      instanceData: { shadow: true, purified: true },
    });

    const background = document.querySelector('.io-bg-img') as HTMLImageElement | null;
    expect(background).not.toBeNull();
    expect(background?.getAttribute('src')).toContain('bg_psychic.png');
  });

  it('updates caught background immediately from preview patch before save', () => {
    renderOverlay('caught', {
      type1_name: 'Psychic',
      instanceData: { shadow: true, purified: false },
    });

    const initialBackground = document.querySelector('.io-bg-img') as HTMLImageElement | null;
    expect(initialBackground?.getAttribute('src')).toContain('bg_shadow.png');

    fireEvent.click(screen.getByRole('button', { name: 'preview-purified' }));

    const updatedBackground = document.querySelector('.io-bg-img') as HTMLImageElement | null;
    expect(updatedBackground?.getAttribute('src')).toContain('bg_psychic.png');
  });

  it('hydrates open overlay instance data from latest instances map without reopening', () => {
    const pokemon = makePokemon({
      instanceData: {
        instance_id: 'instance-1',
        original_trainer_name: null,
      },
    });

    const { rerender } = render(
      <InstanceOverlay
        pokemon={pokemon}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="caught"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
      />,
    );

    expect(screen.getByTestId('caught-instance')).toHaveTextContent('none');

    rerender(
      <InstanceOverlay
        pokemon={pokemon}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="caught"
        lists={{}}
        instances={
          {
            'instance-1': {
              instance_id: 'instance-1',
              original_trainer_name: 'PokePete35',
            },
          } as any
        }
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
      />,
    );

    expect(screen.getByTestId('caught-instance')).toHaveTextContent('PokePete35');
  });

  it('shows only next arrow on first pokemon and navigates forward on arrow click', async () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const p2 = makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } });
    const onNavigatePokemon = vi.fn();

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="caught"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
        navigationPokemons={[p1, p2]}
        onNavigatePokemon={onNavigatePokemon}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Previous Pokemon' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Pokemon' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next Pokemon' }));
    await waitFor(() => expect(onNavigatePokemon).toHaveBeenCalledWith(p2));
  });

  it('navigates forward when swiping left on caught overlay', async () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const p2 = makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } });
    const onNavigatePokemon = vi.fn();

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="caught"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
        navigationPokemons={[p1, p2]}
        onNavigatePokemon={onNavigatePokemon}
      />,
    );

    const overlay = document.querySelector('.instance-overlay') as HTMLElement | null;
    expect(overlay).not.toBeNull();

    fireEvent.mouseDown(overlay as HTMLElement, {
      button: 0,
      clientX: 260,
      clientY: 220,
    });
    fireEvent.mouseUp(overlay as HTMLElement, {
      clientX: 120,
      clientY: 218,
    });

    await waitFor(() => expect(onNavigatePokemon).toHaveBeenCalledWith(p2));
  });

  it('remounts caught instance state when navigating to a different pokemon', async () => {
    const p1 = makePokemon({
      variant_id: '0001-default',
      instanceData: {
        instance_id: 'i-1',
        original_trainer_name: 'TrainerOne',
      },
    });
    const p2 = makePokemon({
      variant_id: '0002-default',
      instanceData: {
        instance_id: 'i-2',
        original_trainer_name: 'TrainerTwo',
      },
    });

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="caught"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
        navigationPokemons={[p1, p2]}
      />,
    );

    expect(screen.getByTestId('caught-instance')).toHaveTextContent('TrainerOne');

    fireEvent.click(screen.getByRole('button', { name: 'Next Pokemon' }));

    await waitFor(() =>
      expect(screen.getByTestId('caught-instance')).toHaveTextContent('TrainerTwo'),
    );
    expect(screen.getByTestId('caught-instance')).not.toHaveTextContent('TrainerOne');
  });
});
