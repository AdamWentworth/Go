import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import Pvp from '@/pages/Pvp/Pvp';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  PokemonPvPLeagueKey,
  PokemonPvPRankingEntry,
  PokemonPvPRankingsPayload,
} from '@shared-contracts/pokemon';

const hookState = vi.hoisted(() => ({
  data: null as PokemonPvPRankingsPayload | null,
  loading: false,
  error: null as string | null,
}));

vi.mock('@/pages/Pvp/hooks/usePvPRankings', () => ({
  usePvPRankings: () => hookState,
}));

const makeEntry = (
  rank: number,
  speciesId: string,
  name: string,
  type: string,
): PokemonPvPRankingEntry => ({
  rank,
  sourceRank: rank,
  speciesId,
  name,
  pokemonId: rank,
  variantKind: 'pokemon',
  imageUrl: `/images/pokemon/${rank}.png`,
  types: [type],
  moveset: [
    { id: `${speciesId}-fast`, name: 'Quick Attack', type: 'normal', kind: 'fast' },
    { id: `${speciesId}-charged`, name: 'Body Slam', type, kind: 'charged' },
  ],
  score: 95 - rank,
  rating: 700,
  categoryScores: rank === 1
    ? [70, 72, 74, 76, 78, 80]
    : [90, 88, 86, 84, 82, 81],
  matchups: [
    { speciesId: 'talonflame', rating: 740 - rank },
  ],
  counters: [
    { speciesId: 'lanturn', rating: 310 + rank },
  ],
  moveUsage: [
    {
      id: `${speciesId}-fast`,
      name: 'Quick Attack',
      type: 'normal',
      kind: 'fast',
      uses: 120,
    },
  ],
  recommendedLevel: 20 + rank / 2,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
});

const makePayload = (): PokemonPvPRankingsPayload => {
  const entries: Record<PokemonPvPLeagueKey, PokemonPvPRankingEntry[]> = {
    great: [
      makeEntry(1, 'clodsire', 'Clodsire', 'poison'),
      makeEntry(2, 'azumarill', 'Azumarill', 'water'),
    ],
    ultra: [makeEntry(1, 'feraligatr', 'Feraligatr', 'water')],
    master: [makeEntry(1, 'zygarde_complete', 'Zygarde Complete', 'dragon')],
  };

  return {
    source: {
      name: 'PvPoke',
      version: 'fixture',
      url: 'https://github.com/pvpoke/pvpoke',
      license: 'MIT',
      importedAt: '2026-07-23T00:00:00Z',
      metadata: {},
    },
    leagues: {
      great: { key: 'great', label: 'Great League', cpLimit: 1500, entries: entries.great },
      ultra: { key: 'ultra', label: 'Ultra League', cpLimit: 2500, entries: entries.ultra },
      master: { key: 'master', label: 'Master League', cpLimit: null, entries: entries.master },
    },
  };
};

describe('PvP rankings page', () => {
  beforeEach(() => {
    hookState.data = makePayload();
    hookState.loading = false;
    hookState.error = null;
    useAuthStore.setState({ isLoggedIn: false, user: null });
    useVariantsStore.setState({
      variants: [],
      variantsLoading: false,
      isMovesLoading: false,
      ensureMoves: vi.fn(),
    });
    useInstancesStore.setState({
      instances: {},
      instancesLoading: false,
    });
  });

  it('starts with Great League and renders its ranked team and build', () => {
    const { container } = render(<Pvp />);

    expect(screen.getByRole('heading', { name: 'PvP Rankings' })).toBeInTheDocument();
    expect(screen.getByText('Clodsire')).toBeInTheDocument();
    expect(screen.getByText('Azumarill')).toBeInTheDocument();
    expect(screen.getAllByText('0/15/15 IV')).toHaveLength(2);
    expect(container.querySelector('.pvp-rank--gold')).toHaveTextContent('1');
    expect(container.querySelector('.pvp-rank--silver')).toHaveTextContent('2');
  });

  it('switches leagues without mixing entries from another league', () => {
    fireEvent.click(render(<Pvp />).getByRole('button', { name: /Ultra/ }));

    expect(screen.getByText('Feraligatr')).toBeInTheDocument();
    expect(screen.queryByText('Clodsire')).not.toBeInTheDocument();
    expect(screen.getByText('1 ranked')).toBeInTheDocument();
  });

  it('re-ranks the current league by the selected battle role', () => {
    const { container } = render(<Pvp />);

    fireEvent.click(screen.getByRole('button', { name: 'Lead' }));

    const rows = container.querySelectorAll('.pvp-ranking-row');
    expect(rows[0]).toHaveTextContent('Azumarill');
    expect(rows[0]).toHaveTextContent('90.0');
    expect(rows[0]).toHaveTextContent('Lead');
    expect(rows[1]).toHaveTextContent('Clodsire');
    expect(screen.getByText('Lead rankings')).toBeInTheDocument();
  });

  it('searches by Pokemon, move, and type', () => {
    render(<Pvp />);
    const search = screen.getByRole('searchbox', { name: 'Search PvP rankings' });

    fireEvent.change(search, { target: { value: 'water' } });
    expect(screen.getByText('Azumarill')).toBeInTheDocument();
    expect(screen.queryByText('Clodsire')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'body slam' } });
    const rankings = document.querySelector('.pvp-rankings');
    expect(rankings).not.toBeNull();
    expect(within(rankings as HTMLElement).getAllByRole('article')).toHaveLength(2);
  });

  it('expands ranking evidence and closes it from the same row', () => {
    render(<Pvp />);

    const details = screen.getByRole('button', {
      name: 'Show details for Clodsire',
    });
    fireEvent.click(details);

    expect(details).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'Strong matchups' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Key threats' })).toBeInTheDocument();
    expect(screen.getByText('Talonflame')).toBeInTheDocument();
    expect(screen.getByText('Lanturn')).toBeInTheDocument();
    expect(screen.getByText('739 battle rating')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide details for Clodsire' }));
    expect(screen.queryByRole('heading', { name: 'Strong matchups' })).not.toBeInTheDocument();
  });

  it('shows only legal, fully recorded caught builds in My Pokemon', () => {
    const moves = [
      {
        move_id: 1,
        name: 'Bubble',
        is_fast: 1,
        type_name: 'water',
        type: 'water',
      },
      {
        move_id: 2,
        name: 'Play Rough',
        is_fast: 0,
        type_name: 'fairy',
        type: 'fairy',
      },
      {
        move_id: 3,
        name: 'Ice Beam',
        is_fast: 0,
        type_name: 'ice',
        type: 'ice',
      },
    ];
    useAuthStore.setState({ isLoggedIn: true });
    useVariantsStore.setState({
      variants: [{
        variant_id: '0002-default',
        pokemon_id: 2,
        pokedex_number: 184,
        name: 'Azumarill',
        species_name: 'Azumarill',
        variantType: 'default',
        currentImage: '/images/my-azumarill.png',
        moves,
        fusion: [],
        crownForms: [],
        megaEvolutions: [],
      } as unknown as PokemonVariant],
    });
    useInstancesStore.setState({
      instances: {
        azu: {
          instance_id: 'azu',
          variant_id: '0002-default',
          pokemon_id: 2,
          nickname: 'Blue',
          cp: 1_498,
          level: 39.5,
          attack_iv: 0,
          defense_iv: 15,
          stamina_iv: 15,
          fast_move_id: 1,
          charged_move1_id: 2,
          charged_move2_id: 3,
          is_caught: true,
          disabled: false,
          shadow: false,
          is_fused: false,
          crown: false,
          mega: false,
          is_mega: false,
          shiny: false,
        } as PokemonInstance,
      },
    });

    render(<Pvp />);
    fireEvent.click(screen.getByRole('button', { name: 'My Pokémon' }));

    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('CP 1,498')).toBeInTheDocument();
    expect(screen.getByText('Level 39.5')).toBeInTheDocument();
    expect(screen.getByText('1 ready')).toBeInTheDocument();
    expect(screen.queryByText('Clodsire')).not.toBeInTheDocument();
  });

  it('shows loading and source failure states without rendering stale rankings', () => {
    hookState.data = null;
    hookState.loading = true;
    const { rerender } = render(<Pvp />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading current rankings');

    hookState.loading = false;
    hookState.error = 'PvP rankings are temporarily unavailable.';
    rerender(<Pvp />);
    expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
