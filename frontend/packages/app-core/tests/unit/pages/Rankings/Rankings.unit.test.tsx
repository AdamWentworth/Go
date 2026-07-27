import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Rankings, { getRankingDisplayName } from '@/pages/Rankings/Rankings';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import type { PokemonVariant } from '@/types/pokemonVariants';

const rankingState = vi.hoisted(() => ({
  data: {
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
        wanted_users: 3,
        most_wanted_users: 0,
        caught_users: 8,
      },
    ],
    rarest: [
      {
        variant_id: 'pikachu-shiny',
        wanted_users: 6,
        most_wanted_users: 2,
        caught_users: 4,
      },
      {
        variant_id: 'bulbasaur-default',
        wanted_users: 3,
        most_wanted_users: 0,
        caught_users: 8,
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
  it('includes collectible forms without duplicating names that already contain them', () => {
    expect(getRankingDisplayName(
      makeVariant('unown-c-shiny', 2306, 'Unown', 'shiny', 'C'),
    )).toBe('Unown (C)');
    expect(getRankingDisplayName(
      makeVariant('dialga-origin', 2059, 'Origin Dialga', 'default', 'Origin'),
    )).toBe('Origin Dialga');
  });

  beforeEach(() => {
    rankingState.error = null;
    rankingState.loading = false;
    rankingState.refresh.mockClear();
    useAuthStore.setState({ isLoggedIn: true, user: null });
    useVariantsStore.setState({
      variants: [
        makeVariant('pikachu-shiny', 25, 'Pikachu', 'shiny'),
        makeVariant('bulbasaur-default', 1, 'Bulbasaur', 'default'),
      ],
      variantsLoading: false,
    });
  });

  it('shows exact distinct-trainer counts and switches ranking modes', () => {
    const { container } = render(<Rankings />);

    expect(screen.getByRole('heading', { name: 'Community Rankings' }))
      .toBeInTheDocument();
    expect(screen.getByText('6 trainers want this')).toBeInTheDocument();
    expect(screen.getByText('One vote per trainer. Duplicate copies count once.'))
      .toBeInTheDocument();
    expect(container.querySelector('.community-ranking-row--rank-1'))
      .toHaveTextContent('Pikachu');

    fireEvent.click(screen.getByRole('tab', { name: 'Rarest caught' }));
    expect(screen.getByText('Caught by 4 trainers')).toBeInTheDocument();
  });

  it('filters the joined catalog without changing the server snapshot', () => {
    render(<Rankings />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search rankings' }), {
      target: { value: 'bulba' },
    });

    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
  });

  it('does not request-facing content for signed-out users', () => {
    useAuthStore.setState({ isLoggedIn: false, user: null });
    render(<Rankings />);

    expect(screen.getByText('Sign in to view community rankings'))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' }))
      .toHaveAttribute('href', '/login');
  });
});
