import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InstanceOverlay, {
  isSwipeInteractiveTarget,
} from '@/pages/Pokemon/features/instances/InstanceOverlay';

vi.mock('@/components/OverlayPortal', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="overlay-portal">{children}</div>
  ),
}));

vi.mock('@/components/WindowOverlay', () => ({
  default: ({
    children,
    className = '',
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div data-testid="window-overlay" className={className} {...props}>
      {children}
    </div>
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

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeTargetsPanel', () => ({
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
  it('uses stacked trade layout below 768px and side-by-side at 768px and above', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 767,
    });

    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const { rerender } = render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
      />,
    );

    expect(document.querySelector('.overlay-row.other-overlays-row')).toHaveClass('column-layout');

    window.innerWidth = 768;
    fireEvent(window, new Event('resize'));

    await waitFor(() =>
      expect(document.querySelector('.overlay-row.other-overlays-row')).not.toHaveClass('column-layout'),
    );

    rerender(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
      />,
    );
  });

  it('renders caught overlay when tag filter is caught', () => {
    renderOverlay('caught');
    expect(screen.getByTestId('caught-instance')).toBeInTheDocument();
  });

  it('renders trade overlay windows when tag filter is trade', () => {
    renderOverlay('trade');
    expect(screen.getByTestId('trade-instance')).toBeInTheDocument();
    expect(screen.getByTestId('trade-details')).toBeInTheDocument();
  });

  it('renders the type background layer for trade overlays too', () => {
    renderOverlay('trade', {
      type1_name: 'Fire',
    });

    const background = document.querySelector('.io-bg-img') as HTMLImageElement | null;
    expect(background).not.toBeNull();
    expect(background?.getAttribute('src')).toContain('bg_fire.png');
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

  it('treats buttons and nested icon elements as interactive swipe targets', () => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    const wrapper = document.createElement('div');
    wrapper.className = 'mirror';

    button.appendChild(image);
    wrapper.appendChild(document.createElement('img'));
    document.body.appendChild(button);
    document.body.appendChild(wrapper);

    expect(isSwipeInteractiveTarget(button)).toBe(true);
    expect(isSwipeInteractiveTarget(image)).toBe(true);
    expect(isSwipeInteractiveTarget(wrapper.firstElementChild)).toBe(true);
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

  it('shows trade navigation arrows and navigates forward on arrow click', async () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const p2 = makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } });
    const onNavigatePokemon = vi.fn();

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
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
    expect(screen.getByTestId('trade-instance')).toBeInTheDocument();
    expect(screen.getByTestId('trade-details')).toBeInTheDocument();
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
    fireEvent.mouseMove(overlay as HTMLElement, {
      clientX: 190,
      clientY: 222,
    });
    fireEvent.mouseUp(overlay as HTMLElement, {
      clientX: 120,
      clientY: 218,
    });

    await waitFor(() => expect(onNavigatePokemon).toHaveBeenCalledWith(p2));
  });

  it('navigates forward when swiping left on trade overlay', async () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const p2 = makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } });
    const onNavigatePokemon = vi.fn();

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
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
    fireEvent.mouseMove(overlay as HTMLElement, {
      clientX: 190,
      clientY: 222,
    });
    fireEvent.mouseUp(overlay as HTMLElement, {
      clientX: 120,
      clientY: 218,
    });

    await waitFor(() => expect(onNavigatePokemon).toHaveBeenCalledWith(p2));
    expect(screen.getByTestId('trade-instance')).toBeInTheDocument();
    expect(screen.getByTestId('trade-details')).toBeInTheDocument();
  });

  it('navigates forward when swiping left from the trade details window', async () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const p2 = makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } });
    const onNavigatePokemon = vi.fn();

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
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

    const tradeDetailsWindow = document.querySelector('.trade-details-window') as HTMLElement | null;
    expect(tradeDetailsWindow).not.toBeNull();

    fireEvent.mouseDown(tradeDetailsWindow as HTMLElement, {
      button: 0,
      clientX: 260,
      clientY: 220,
    });
    fireEvent.mouseMove(tradeDetailsWindow as HTMLElement, {
      clientX: 180,
      clientY: 224,
    });
    fireEvent.mouseUp(tradeDetailsWindow as HTMLElement, {
      clientX: 120,
      clientY: 224,
    });

    await waitFor(() => expect(onNavigatePokemon).toHaveBeenCalledWith(p2));
  });

  it('locks trade overlay into horizontal swipe mode during a horizontal drag', () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
        lists={{}}
        instances={{}}
        sortType="name"
        sortMode="ascending"
        isEditable={true}
        username="ash"
        navigationPokemons={[p1, makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } })]}
      />,
    );

    const overlay = document.querySelector('.instance-overlay') as HTMLElement | null;
    expect(overlay).not.toBeNull();

    fireEvent.mouseDown(overlay as HTMLElement, {
      button: 0,
      clientX: 260,
      clientY: 220,
    });
    fireEvent.mouseMove(overlay as HTMLElement, {
      clientX: 208,
      clientY: 228,
    });

    expect(overlay).toHaveClass('is-horizontal-swiping');

    fireEvent.mouseUp(overlay as HTMLElement, {
      clientX: 208,
      clientY: 228,
    });

    expect(overlay).not.toHaveClass('is-horizontal-swiping');
  });

  it('navigates trade after axis locks horizontal even with extra vertical drift', async () => {
    const p1 = makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'i-1' } });
    const p2 = makePokemon({ variant_id: '0002-default', instanceData: { instance_id: 'i-2' } });
    const onNavigatePokemon = vi.fn();

    render(
      <InstanceOverlay
        pokemon={p1}
        onClose={vi.fn()}
        variants={[]}
        tagFilter="trade"
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

    const tradeDetailsWindow = document.querySelector('.trade-details-window') as HTMLElement | null;
    expect(tradeDetailsWindow).not.toBeNull();

    fireEvent.mouseDown(tradeDetailsWindow as HTMLElement, {
      button: 0,
      clientX: 300,
      clientY: 220,
    });
    fireEvent.mouseMove(tradeDetailsWindow as HTMLElement, {
      clientX: 238,
      clientY: 258,
    });
    fireEvent.mouseUp(tradeDetailsWindow as HTMLElement, {
      clientX: 228,
      clientY: 286,
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
