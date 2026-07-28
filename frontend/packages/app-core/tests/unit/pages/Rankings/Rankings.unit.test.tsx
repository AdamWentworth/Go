import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router';
import Rankings, {
  collapseEvolutionFamilyRankings,
  getRankingCatalogSearch,
  getRankingDisplayName,
  getRankingsErrorMessage,
  prepareRankingsForMode,
} from '@/pages/Rankings/Rankings';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { AppLoadingProvider } from '@/contexts/AppLoadingContext';

const rankingState = vi.hoisted(() => ({
  data: {
    privacy_threshold: 5,
    snapshot: {
      collector_users: 8,
      wishlist_users: 6,
      updated_at: '2026-07-25T12:00:00Z',
    },
    most_wanted: [
      {
        variant_id: 'pikachu-shiny',
        wanted_users: 6,
        most_wanted_users: 2,
        caught_users: 4,
      },
      {
        variant_id: 'bulbasaur-default',
        wanted_users: null,
        most_wanted_users: null,
        caught_users: 8,
      },
      {
        variant_id: 'charizard-dynamax',
        wanted_users: 3,
        most_wanted_users: 1,
        caught_users: 5,
      },
      {
        variant_id: 'charizard-gigantamax',
        wanted_users: 2,
        most_wanted_users: 1,
        caught_users: 3,
      },
    ],
    rarest: [
      {
        variant_id: 'pikachu-shiny',
        wanted_users: 6,
        most_wanted_users: null,
        caught_users: 4,
      },
      {
        variant_id: 'bulbasaur-default',
        wanted_users: null,
        most_wanted_users: null,
        caught_users: 8,
      },
      {
        variant_id: 'charizard-dynamax',
        wanted_users: 3,
        most_wanted_users: null,
        caught_users: 5,
      },
      {
        variant_id: 'charizard-gigantamax',
        wanted_users: 2,
        most_wanted_users: null,
        caught_users: 3,
      },
    ],
  },
  error: null as string | null,
  loading: false,
  refresh: vi.fn(),
}));

vi.mock('@/pages/Rankings/hooks/useCommunityRankings', () => ({
  useCommunityRankings: () => rankingState,
}));
vi.mock('@/features/variants/hooks/useBootstrapVariants', () => ({
  useBootstrapVariants: vi.fn(),
}));

const RankingLocation = () => {
  const location = useLocation();
  return <output data-testid="ranking-location">{location.search}</output>;
};

const renderRankings = (initialEntry = '/rankings') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Rankings />
      <RankingLocation />
    </MemoryRouter>,
  );

const makeVariant = (
  variantID: string,
  pokemonID: number,
  name: string,
  variantType: PokemonVariant['variantType'],
  form: string | null = null,
): PokemonVariant =>
  ({
    variant_id: variantID,
    pokemon_id: pokemonID,
    pokedex_number: pokemonID,
    name,
    species_name: name,
    form,
    variantType,
    currentImage: `/images/${variantID}.png`,
    image_url: `/images/${variantID}.png`,
  }) as PokemonVariant;

describe('Community Rankings page', () => {
  it('turns technical ranking failures into actionable messages', () => {
    expect(getRankingsErrorMessage('Request timed out after 10000ms', true))
      .toContain('took too long');
    expect(getRankingsErrorMessage('503 Service Unavailable', true))
      .toContain('temporarily unavailable');
    expect(getRankingsErrorMessage('Failed to fetch', false))
      .toContain('offline');
    expect(getRankingsErrorMessage('opaque network failure', true))
      .toContain('could not be refreshed');
  });

  it('includes collectible forms without duplicating names that already contain them', () => {
    expect(getRankingDisplayName(
      makeVariant('unown-c-shiny', 2306, 'Unown', 'shiny', 'C'),
    )).toBe('Unown C');
    expect(getRankingDisplayName(
      makeVariant('dialga-origin', 2059, 'Origin Dialga', 'default', 'Origin'),
    )).toBe('Origin Dialga');
  });

  it('builds catalog searches from the species and collectible qualities', () => {
    expect(
      getRankingCatalogSearch(
        makeVariant('rayquaza-shiny', 384, 'Rayquaza', 'shiny'),
      ),
    ).toBe('rayquaza&shiny');
    expect(
      getRankingCatalogSearch(
        makeVariant(
          'charizard-shiny-gigantamax',
          6,
          'Charizard',
          'shiny_gigantamax',
        ),
      ),
    ).toBe('charizard&shiny&gigantamax');
  });

  it('collapses ordinary evolution families while preserving costumes', () => {
    const meowth = {
      ...makeVariant('0052-shiny_shadow', 52, 'Meowth', 'shiny_shadow'),
      evolutionData: { evolves_to: [53] },
    } as PokemonVariant;
    const persian = {
      ...makeVariant('0053-shiny_shadow', 53, 'Persian', 'shiny_shadow'),
      evolutionData: { evolves_from: [52] },
    } as PokemonVariant;
    const costumePersian = {
      ...persian,
      variant_id: '0053-party_costume',
      variantType: 'costume_party',
    } as PokemonVariant;
    const ranking = (variant: PokemonVariant) => ({
      variant_id: variant.variant_id,
      wanted_users: 10,
      most_wanted_users: 5,
      caught_users: 2,
      variant,
    });

    expect(
      collapseEvolutionFamilyRankings(
        [ranking(persian), ranking(meowth), ranking(costumePersian)],
        [meowth, persian, costumePersian],
      ).map((entry) => entry.variant_id),
    ).toEqual(['0052-shiny_shadow', '0053-party_costume']);
  });

  it('collapses evolution families only for rarest caught rankings', () => {
    const meowth = {
      ...makeVariant('0052-shiny_shadow', 52, 'Meowth', 'shiny_shadow'),
      evolutionData: { evolves_to: [53] },
    } as PokemonVariant;
    const persian = {
      ...makeVariant('0053-shiny_shadow', 53, 'Persian', 'shiny_shadow'),
      evolutionData: { evolves_from: [52] },
    } as PokemonVariant;
    const ranking = (variant: PokemonVariant) => ({
      variant_id: variant.variant_id,
      wanted_users: 0,
      most_wanted_users: 0,
      caught_users: 27,
      variant,
    });
    const rows = [ranking(meowth), ranking(persian)];

    expect(prepareRankingsForMode('wanted', rows, [meowth, persian]))
      .toHaveLength(2);
    expect(prepareRankingsForMode('rarest', rows, [meowth, persian]))
      .toHaveLength(1);
  });

  beforeEach(() => {
    window.sessionStorage.clear();
    rankingState.error = null;
    rankingState.loading = false;
    rankingState.refresh.mockClear();
    useVariantsStore.setState({
      variants: [
        makeVariant('pikachu-shiny', 25, 'Pikachu', 'shiny'),
        makeVariant('bulbasaur-default', 1, 'Bulbasaur', 'default'),
        makeVariant('charizard-dynamax', 6, 'Charizard', 'dynamax'),
        makeVariant('charizard-gigantamax', 6, 'Charizard', 'gigantamax'),
      ],
      variantsLoading: false,
    });
    useAuthStore.setState({ isLoggedIn: false, user: null });
    useInstancesStore.setState({ instances: {}, instancesLoading: false });
  });

  it('shows exact distinct-trainer counts and switches ranking modes', () => {
    const { container } = renderRankings();

    expect(screen.getByRole('heading', { name: 'Community Rankings' }))
      .toBeInTheDocument();
    expect(screen.getByText('6 trainers want this')).toBeInTheDocument();
    expect(screen.queryByText('Owned by 4 trainers')).not.toBeInTheDocument();
    expect(screen.getByText('One vote per trainer. Duplicate copies count once.'))
      .toBeInTheDocument();
    expect(container.querySelector('.community-ranking-row--rank-1'))
      .toHaveTextContent('Pikachu');
    expect(screen.getByRole('tabpanel', { name: 'Most wanted Pokémon' }))
      .toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.community-ranking-filter-summary [role="status"]'))
      .toHaveTextContent('4 results');
    expect(screen.getByRole('tab', { name: 'Most wanted' }))
      .toHaveAttribute('aria-controls', 'community-ranking-results');

    fireEvent.click(screen.getByRole('tab', { name: 'Rarest owned' }));
    expect(screen.getByText('Owned by 4 trainers')).toBeInTheDocument();
    expect(screen.queryByText('6 trainers want this')).not.toBeInTheDocument();
  });

  it('supports complete keyboard navigation between ranking tabs', () => {
    renderRankings();
    const wantedTab = screen.getByRole('tab', { name: 'Most wanted' });
    const rarestTab = screen.getByRole('tab', { name: 'Rarest owned' });

    wantedTab.focus();
    fireEvent.keyDown(wantedTab, { key: 'ArrowRight' });
    expect(rarestTab).toHaveFocus();
    expect(rarestTab).toHaveAttribute('aria-selected', 'true');
    expect(wantedTab).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(rarestTab, { key: 'Home' });
    expect(wantedTab).toHaveFocus();
    expect(wantedTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(wantedTab, { key: 'End' });
    expect(rarestTab).toHaveFocus();
    expect(rarestTab).toHaveAttribute('aria-selected', 'true');
  });

  it('has no automated accessibility violations in the public view', async () => {
    const { container } = renderRankings();

    await expect(container).toHaveNoViolations();
  });

  it('refreshes the snapshot from the timestamp control', () => {
    renderRankings();

    fireEvent.click(
      screen.getByRole('button', { name: 'Refresh community rankings' }),
    );

    expect(rankingState.refresh).toHaveBeenCalledTimes(1);
  });

  it('uses the global loading overlay until ranking dependencies are ready', () => {
    rankingState.loading = true;
    useVariantsStore.setState({ variantsLoading: true });

    const { container } = render(
      <MemoryRouter initialEntries={['/rankings']}>
        <AppLoadingProvider>
          <Rankings />
        </AppLoadingProvider>
      </MemoryRouter>,
    );

    expect(container.querySelector('.app-loading-overlay')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Community Rankings' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the last snapshot visible when a refresh fails', () => {
    rankingState.loading = true;
    rankingState.error = 'Network unavailable';

    const { container } = render(
      <MemoryRouter initialEntries={['/rankings']}>
        <AppLoadingProvider>
          <Rankings />
        </AppLoadingProvider>
      </MemoryRouter>,
    );

    expect(container.querySelector('.app-loading-overlay')).not.toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Showing the last community snapshot. Refresh is temporarily unavailable.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(rankingState.refresh).toHaveBeenCalledOnce();
  });

  it('explains the public ranking method without crowding the results', () => {
    renderRankings();

    const method = screen.getByText('How these rankings work').closest('details');
    expect(method).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('How these rankings work'));
    expect(method).toHaveTextContent(
      'Most wanted counts distinct trainer wishlists',
    );
    expect(method).toHaveTextContent(
      'Rarest owned counts trainers with a caught copy',
    );
  });

  it('filters the joined catalog without changing the server snapshot', () => {
    renderRankings();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search rankings' }), {
      target: { value: 'bulba' },
    });

    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Rank 2')).toBeInTheDocument();
  });

  it('offers a useful recovery action when search has no matches', () => {
    renderRankings();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search rankings' }), {
      target: { value: 'missingno' },
    });

    expect(screen.getByText('No matching Pokémon')).toBeInTheDocument();
    expect(
      screen.getByText('Try another name, form, or Pokédex number.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
  });

  it('explains empty personal views and links to the relevant workflow', () => {
    useAuthStore.setState({ isLoggedIn: true });
    renderRankings();

    fireEvent.click(screen.getByRole('button', { name: 'For trade' }));

    expect(screen.getByText('Nothing is listed for trade')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my Pokémon' }))
      .toHaveAttribute('href', '/pokemon?filter=caught');
  });

  it('summarizes active filters while preserving community ranks', () => {
    const { container } = renderRankings();

    const rows = Array.from(
      container.querySelectorAll('.community-ranking-row'),
    );
    expect(rows[0]).toHaveTextContent('Pikachu');
    expect(rows[0]).toHaveTextContent('1');
    expect(container.querySelector('.community-ranking-filter-summary'))
      .toHaveTextContent('All Pokémon');

    fireEvent.click(screen.getByRole('button', { name: 'Shiny' }));
    expect(container.querySelector('.community-ranking-filter-summary'))
      .toHaveTextContent(/1 results.*Shiny/);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('stores ranking view controls in a shareable URL', () => {
    const first = renderRankings();

    fireEvent.click(screen.getByRole('tab', { name: 'Rarest owned' }));
    fireEvent.click(screen.getByRole('button', { name: 'Shadow' }));
    expect(screen.getByTestId('ranking-location')).toHaveTextContent(
      '?view=rarest&category=shadow',
    );
    first.unmount();

    renderRankings('/rankings?view=rarest&category=shadow');
    expect(screen.getByRole('tab', { name: 'Rarest owned' }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Shadow' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('reveals compact controls after the primary filters scroll away', () => {
    let notify:
      | ((entries: Array<Partial<IntersectionObserverEntry>>) => void)
      | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback as typeof notify;
        }

        observe() {}

        disconnect() {
          disconnect();
        }
      },
    );

    renderRankings();
    act(() => {
      notify?.([
        {
          isIntersecting: false,
          boundingClientRect: { bottom: -1 } as DOMRectReadOnly,
        },
      ]);
    });

    expect(
      screen.getByRole('navigation', { name: 'Quick ranking controls' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Ranking view' }),
    ).toHaveValue('wanted');

    vi.unstubAllGlobals();
  });

  it('uses the same Dynamax and Gigantamax badges as Pokémon cards', () => {
    renderRankings();

    expect(screen.getByAltText('Dynamax')).toHaveAttribute(
      'src',
      '/images/dynamax.png',
    );
    expect(screen.getByAltText('Gigantamax')).toHaveAttribute(
      'src',
      '/images/gigantamax.png',
    );
  });

  it('uses profile playstyle artwork in the compact ranking filters', () => {
    renderRankings();

    const allButton = screen.getByRole('button', { name: 'All' });
    const shinyButton = screen.getByRole('button', { name: 'Shiny' });
    const costumeButton = screen.getByRole('button', { name: 'Costume' });
    const maxButton = screen.getByRole('button', { name: 'Max' });

    expect(allButton.querySelector('[data-ranking-filter-asset]')).toBeNull();
    expect(shinyButton.querySelector('[data-ranking-filter-asset]'))
      .toHaveAttribute('data-ranking-filter-asset', '/images/shiny_search.png');
    expect(costumeButton.querySelector('[data-ranking-filter-asset]'))
      .toHaveAttribute('data-ranking-filter-asset', '/images/costume_search.png');
    expect(maxButton.querySelector('[data-ranking-filter-asset]'))
      .toHaveAttribute(
        'data-ranking-filter-asset',
        '/images/gigantamax_title_mask.png',
      );

    fireEvent.click(screen.getByRole('tab', { name: 'Rarest owned' }));
    expect(
      screen
        .getByRole('button', { name: 'Shadow' })
        .querySelector('[data-ranking-filter-asset]'),
    ).toHaveAttribute(
      'data-ranking-filter-asset',
      '/images/shadow_search.png',
    );
  });

  it('shows public rankings without requiring a signed-in user', () => {
    renderRankings();

    expect(screen.getByRole('heading', { name: 'Community Rankings' }))
      .toBeInTheDocument();
    expect(screen.getByText('6 trainers want this')).toBeInTheDocument();
    expect(screen.queryByText('Sign in to view community rankings'))
      .not.toBeInTheDocument();
  });

  it('layers personal collection status and filters over community ranks', () => {
    useAuthStore.setState({ isLoggedIn: true });
    useInstancesStore.setState({
      instances: {
        pikachu: {
          variant_id: 'pikachu-shiny',
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          registered: true,
          disabled: false,
        },
      } as never,
      instancesLoading: false,
    });

    renderRankings();

    expect(screen.getByText('1 caught')).toBeInTheDocument();
    expect(screen.queryByText('1 not listed')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View collection' }))
      .toHaveAttribute(
        'href',
        '/pokemon?filter=caught&search=pikachu%26shiny',
      );

    expect(screen.queryByRole('button', { name: 'Available' }))
      .not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'I have' }),
    ).toHaveTextContent('I have1');
    expect(
      screen.getByRole('button', { name: 'For trade' }),
    ).toHaveTextContent('For trade0');
    expect(
      screen.getByRole('button', { name: 'Missing' }),
    ).toHaveTextContent('Missing3');

    fireEvent.click(screen.getByRole('button', { name: 'I have' }));
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.queryByText('Bulbasaur')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Missing' }));
    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
  });
});
