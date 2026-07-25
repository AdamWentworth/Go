import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
const bootstrapHooks = vi.hoisted(() => ({
  variants: vi.fn(),
  instances: vi.fn(),
}));

vi.mock('@/pages/Pvp/hooks/usePvPRankings', () => ({
  usePvPRankings: () => hookState,
}));
vi.mock('@/pages/Pvp/hooks/usePvPMoveMechanics', () => ({
  usePvPMoveMechanics: () => ({
    data: new Map(),
    loading: false,
    error: null,
  }),
}));
vi.mock('@/features/variants/hooks/useBootstrapVariants', () => ({
  useBootstrapVariants: bootstrapHooks.variants,
}));
vi.mock('@/features/instances/hooks/useBootstrapInstances', () => ({
  useBootstrapInstances: bootstrapHooks.instances,
}));

const renderPvp = () => render(<Pvp />, { wrapper: MemoryRouter });

const makeEntry = (
  rank: number,
  speciesId: string,
  name: string,
  type: string,
  pokemonId = rank,
): PokemonPvPRankingEntry => ({
  rank,
  sourceRank: rank,
  speciesId,
  name,
  pokemonId,
  variantKind: 'pokemon',
  imageUrl: `/images/pokemon/${rank}.png`,
  types: [type],
  moveset: [
    {
      id: `${speciesId}-fast`,
      name: 'Quick Attack',
      type: 'normal',
      kind: 'fast',
      power: 8,
      energyGain: 10,
      energyCost: 0,
      turns: 2,
      buff: {
        attackerAttack: 0,
        attackerDefense: 0,
        targetAttack: 0,
        targetDefense: 0,
        chance: 0,
      },
    },
    {
      id: `${speciesId}-charged`,
      name: 'Body Slam',
      type,
      kind: 'charged',
      power: 60,
      energyGain: 0,
      energyCost: 35,
      turns: 1,
      buff: {
        attackerAttack: 0,
        attackerDefense: 0,
        targetAttack: 0,
        targetDefense: 0,
        chance: 0,
      },
    },
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
  battleAttack: 120 + rank,
  battleDefense: 140 + rank,
  battleHp: 160 + rank,
});

const makePayload = (): PokemonPvPRankingsPayload => {
  const entries: Record<PokemonPvPLeagueKey, PokemonPvPRankingEntry[]> = {
    great: [
      makeEntry(1, 'clodsire', 'Clodsire', 'poison', 980),
      makeEntry(2, 'azumarill', 'Azumarill', 'water', 184),
    ],
    ultra: [makeEntry(1, 'feraligatr', 'Feraligatr', 'water', 160)],
    master: [makeEntry(1, 'zygarde_complete', 'Zygarde Complete', 'dragon', 718)],
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
    formats: [
      {
        key: 'retro-1500',
        label: 'Retro Cup',
        league: 'great',
        cup: 'retro',
        cpLimit: 1500,
        rules: ['Dark-, Steel-, and Fairy-type Pokémon are not eligible.'],
        entries: [makeEntry(1, 'diggersby', 'Diggersby', 'normal', 660)],
      },
    ],
  };
};

describe('PvP rankings page', () => {
  beforeEach(() => {
    window.localStorage.removeItem('pvpTeams');
    hookState.data = makePayload();
    hookState.loading = false;
    hookState.error = null;
    bootstrapHooks.variants.mockClear();
    bootstrapHooks.instances.mockClear();
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
    const { container } = renderPvp();

    expect(bootstrapHooks.variants).toHaveBeenLastCalledWith(false);
    expect(bootstrapHooks.instances).toHaveBeenLastCalledWith(false);
    expect(useVariantsStore.getState().ensureMoves).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'PvP Rankings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Method' }))
      .toHaveAttribute('href', '/pvp/methodology');
    expect(screen.getAllByText('Clodsire').length).toBeGreaterThan(0);
    expect(screen.getByText('Azumarill')).toBeInTheDocument();
    expect(screen.getAllByText('0/15/15 IV')).toHaveLength(2);
    expect(container.querySelector('.pvp-rank--gold')).toHaveTextContent('1');
    expect(container.querySelector('.pvp-rank--silver')).toHaveTextContent('2');
  });

  it('switches leagues without mixing entries from another league', () => {
    fireEvent.click(renderPvp().getByRole('button', { name: /Ultra/ }));

    expect(screen.getByText('Feraligatr')).toBeInTheDocument();
    expect(screen.queryByText('Clodsire')).not.toBeInTheDocument();
    expect(screen.getByText('1 ranked')).toBeInTheDocument();
  });

  it('switches the entire workspace to a source-ranked current cup', () => {
    renderPvp();

    fireEvent.change(screen.getByRole('combobox', { name: 'Current PvP cup' }), {
      target: { value: 'retro-1500' },
    });

    expect(screen.getByText('Diggersby')).toBeInTheDocument();
    expect(screen.queryByText('Clodsire')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Retro Cup rankings' }))
      .toBeInTheDocument();
    fireEvent.click(screen.getByText('Format rules'));
    expect(screen.getByText(/Dark-, Steel-, and Fairy-type/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Team Builder' }));
    expect(screen.getAllByText('Choose Pokémon')).toHaveLength(3);
    expect(screen.getByRole('button', {
      name: 'Select Lead with Diggersby',
    }))
      .toBeInTheDocument();
  });

  it('re-ranks the current league by the selected battle role', () => {
    const { container } = renderPvp();

    fireEvent.click(screen.getByRole('button', { name: 'Lead' }));

    const rows = container.querySelectorAll('.pvp-ranking-row');
    expect(rows[0]).toHaveTextContent('Azumarill');
    expect(rows[0]).toHaveTextContent('90.0');
    expect(rows[0]).toHaveTextContent('Lead');
    expect(rows[1]).toHaveTextContent('Clodsire');
    expect(screen.getByText('Lead rankings')).toBeInTheDocument();
  });

  it('searches by Pokemon, move, and type', () => {
    renderPvp();
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
    renderPvp();

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

  it('builds and preserves a three-Pokemon team with threat evidence', () => {
    const { unmount } = renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'Team Builder' }));

    expect(screen.getByRole('heading', { name: 'Team Builder' })).toBeInTheDocument();
    expect(screen.getAllByText('Choose Pokémon')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', {
      name: 'Select Lead with Clodsire',
    }));
    fireEvent.click(screen.getByRole('button', {
      name: 'Select Safe Swap with Azumarill',
    }));

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Published matchup evidence'));
    expect(screen.getByText('Threatens 2 · Open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Clodsire from team' }))
      .toBeInTheDocument();

    unmount();
    renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'Team Builder' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('opens the Battle Lab workspace for the current league', () => {
    renderPvp();

    fireEvent.click(screen.getByRole('button', { name: 'Battle Lab' }));

    expect(screen.getByText('Great League · focused 1v1 · June 2026 rules'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Swap battle sides' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run battle' }))
      .toBeEnabled();
  });

  it('evaluates all three roles locally and opens a hard matchup in Battle Lab', async () => {
    hookState.data!.leagues.great.entries.push(
      makeEntry(3, 'lanturn', 'Lanturn', 'water', 171),
    );
    renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'Team Builder' }));

    fireEvent.click(screen.getByRole('button', {
      name: 'Select Lead with Clodsire',
    }));
    fireEvent.click(screen.getByRole('button', {
      name: 'Select Safe Swap with Azumarill',
    }));
    fireEvent.click(screen.getByRole('button', {
      name: 'Select Closer with Lanturn',
    }));

    expect(await screen.findByText('Role tests')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Published matchup evidence'));
    fireEvent.click(screen.getByRole('button', {
      name: 'Test Lanturn in Battle Lab',
    }));

    expect(screen.getByRole('heading', { name: 'PvP Battle Lab' }))
      .toBeInTheDocument();
    expect(screen.getAllByText('Clodsire').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lanturn').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Team battle' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Edit Side A Lead: Clodsire/ }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Side A Safe Swap: Azumarill/ }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Side A Closer: Lanturn/ }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adaptive/ }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Current 45-second battle clock'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run team battle' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Run team battle' }));
    expect(await screen.findByText('Switch-aware 3v3 result'))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Test 3 meta teams/ }));
    expect(await screen.findByText(
      'Wins, losses, and draws against current top role combinations.',
    )).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fixed order/ }));
    expect(screen.getByRole('button', { name: /Fixed order/ }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Switch-aware 3v3 result')).not.toBeInTheDocument();
  });

  it('opens IV Rank with a catalog-only lazy load and calculates a spread', () => {
    useVariantsStore.setState({
      variants: [{
        variant_id: '0001-default',
        pokemon_id: 1,
        pokedex_number: 1,
        name: 'Bulbasaur',
        species_name: 'Bulbasaur',
        variantType: 'default',
        currentImage: '/images/bulbasaur.png',
        image_url: '/images/bulbasaur.png',
        attack: 118,
        defense: 111,
        stamina: 128,
        type1_name: 'Grass',
        type2_name: 'Poison',
        crownForms: [],
      } as unknown as PokemonVariant],
      variantsLoading: false,
    });

    renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'IV Rank' }));

    expect(bootstrapHooks.variants).toHaveBeenLastCalledWith(true);
    expect(bootstrapHooks.instances).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('heading', { name: 'PvP IV Rank' })).toBeInTheDocument();
    expect(screen.getByText('4,096 spreads')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Current PvP cup' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'PvP roster' }))
      .not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', {
      name: 'Search IV Rank Pokémon',
    }), {
      target: { value: 'bulba' },
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'Select #0001 Bulbasaur',
    }));

    expect(screen.getByText('of 4,096')).toBeInTheDocument();
    expect(screen.getByText('Rank 1 spread')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Attack IV' })).toHaveValue(0);
    expect(screen.getByRole('spinbutton', { name: 'Defense IV' })).toHaveValue(15);
    expect(screen.getByRole('spinbutton', { name: 'HP IV' })).toHaveValue(15);
  });

  it('compares caught copies by IV rank without requiring move details', () => {
    useAuthStore.setState({ isLoggedIn: true });
    useVariantsStore.setState({
      variants: [
        {
          variant_id: '0001-default',
          pokemon_id: 1,
          pokedex_number: 1,
          name: 'Bulbasaur',
          species_name: 'Bulbasaur',
          variantType: 'default',
          currentImage: '/images/bulbasaur.png',
          image_url: '/images/bulbasaur.png',
          attack: 118,
          defense: 111,
          stamina: 128,
          type1_name: 'Grass',
          type2_name: 'Poison',
          crownForms: [],
        } as unknown as PokemonVariant,
        {
          variant_id: '0906-default',
          pokemon_id: 906,
          pokedex_number: 906,
          name: 'Sprigatito',
          species_name: 'Sprigatito',
          variantType: 'default',
          currentImage: '/images/sprigatito.png',
          image_url: '/images/sprigatito.png',
          attack: 116,
          defense: 99,
          stamina: 120,
          type1_name: 'Grass',
          type2_name: null,
          crownForms: [],
        } as unknown as PokemonVariant,
      ],
      variantsLoading: false,
    });
    useInstancesStore.setState({
      instances: {
        perfect: {
          instance_id: 'perfect',
          variant_id: '0001-default',
          pokemon_id: 1,
          nickname: 'Perfect',
          is_caught: true,
          disabled: false,
          cp: 1_600,
          level: 50,
          attack_iv: 15,
          defense_iv: 15,
          stamina_iv: 15,
          favorite: true,
        } as PokemonInstance,
        sprout: {
          instance_id: 'sprout',
          variant_id: '0001-default',
          pokemon_id: 1,
          nickname: 'Sprout',
          is_caught: true,
          disabled: false,
          cp: 1_118,
          level: 50,
          attack_iv: 0,
          defense_iv: 15,
          stamina_iv: 15,
        } as PokemonInstance,
        paldea: {
          instance_id: 'paldea',
          variant_id: '0906-default',
          pokemon_id: 906,
          nickname: 'Paldea',
          is_caught: true,
          disabled: false,
          cp: 500,
          level: 20,
          attack_iv: 1,
          defense_iv: 15,
          stamina_iv: 15,
        } as PokemonInstance,
      },
      instancesLoading: false,
    });
    hookState.data!.leagues.great.entries.push(
      makeEntry(3, 'sprigatito', 'Sprigatito', 'grass', 906),
    );

    renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'IV Rank' }));
    fireEvent.click(screen.getByRole('button', { name: /My Pokémon/ }));

    expect(bootstrapHooks.instances).toHaveBeenLastCalledWith(true);
    expect(screen.getByText(
      '2 eligible for Great League · 1 over cap hidden',
    )).toBeInTheDocument();
    expect(screen.queryByText('Perfect')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: /Check Paldea, Sprigatito, IV 1\/15\/15, Meta rank 3, IV rank/,
    })).toBeInTheDocument();
    const browser = screen.getByLabelText('Browse your appraised Pokémon');
    expect(browser.closest('.pvp-iv-workbench'))
      .toHaveClass('pvp-iv-workbench--browsing');
    expect(screen.queryByRole('region', { name: 'IV Rank result' }))
      .not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', {
      name: 'Search IV Rank Pokémon',
    }), {
      target: { value: 'sprout' },
    });
    fireEvent.click(screen.getByRole('button', {
      name: /Check Sprout, Bulbasaur, IV 0\/15\/15/,
    }));

    const copies = screen.getByRole('region', { name: 'Your Bulbasaur' });
    expect(copies).toBeInTheDocument();
    const sprout = screen.getByRole('button', {
      name: 'View Sprout, IV Rank 770',
    });
    expect(sprout).toBeInTheDocument();
    expect(within(copies).getAllByRole('button')[0]).toBe(sprout);

    fireEvent.click(sprout);
    const result = screen.getByRole('region', { name: 'IV Rank result' });
    expect(result.closest('.pvp-iv-workbench'))
      .not.toHaveClass('pvp-iv-workbench--browsing');
    expect(within(result).getByText('Sprout')).toBeInTheDocument();
    expect(within(result).getAllByText('#770')).toHaveLength(2);
    expect(within(result).getByText(/CP 1,118 · Level 50/)).toBeInTheDocument();
  });

  it('shows only legal, fully recorded caught builds in My Pokemon', () => {
    const moves = [
      {
        move_id: 1,
        name: 'Bubble',
        is_fast: 1,
        type_name: 'water',
        type: 'water',
        pvp_power: 8,
        pvp_energy: 11,
        pvp_turns: 3,
        pvp_attacker_attack_stage_change: 0,
        pvp_attacker_defense_stage_change: 0,
        pvp_target_attack_stage_change: 0,
        pvp_target_defense_stage_change: 0,
        pvp_buff_activation_chance: 0,
      },
      {
        move_id: 2,
        name: 'Play Rough',
        is_fast: 0,
        type_name: 'fairy',
        type: 'fairy',
        pvp_power: 90,
        pvp_energy: -60,
        pvp_turns: 1,
        pvp_attacker_attack_stage_change: 0,
        pvp_attacker_defense_stage_change: 0,
        pvp_target_attack_stage_change: 0,
        pvp_target_defense_stage_change: 0,
        pvp_buff_activation_chance: 0,
      },
      {
        move_id: 3,
        name: 'Ice Beam',
        is_fast: 0,
        type_name: 'ice',
        type: 'ice',
        pvp_power: 90,
        pvp_energy: -55,
        pvp_turns: 1,
        pvp_attacker_attack_stage_change: 0,
        pvp_attacker_defense_stage_change: 0,
        pvp_target_attack_stage_change: 0,
        pvp_target_defense_stage_change: 0,
        pvp_buff_activation_chance: 0,
      },
    ];
    useAuthStore.setState({ isLoggedIn: true });
    useVariantsStore.setState({
      variants: [{
        variant_id: '0002-default',
        pokemon_id: 184,
        pokedex_number: 184,
        name: 'Azumarill',
        species_name: 'Azumarill',
        variantType: 'default',
        currentImage: '/images/my-azumarill.png',
        attack: 112,
        defense: 152,
        stamina: 225,
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
          pokemon_id: 184,
          nickname: 'Blue',
          cp: 1_498,
          level: 39.5,
          attack_iv: 0,
          defense_iv: 15,
          stamina_iv: 15,
          fast_move_id: 1,
          charged_move1_id: 2,
          charged_move2_id: null,
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

    renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'My Pokémon' }));

    expect(bootstrapHooks.variants).toHaveBeenLastCalledWith(true);
    expect(bootstrapHooks.instances).toHaveBeenLastCalledWith(true);
    expect(useVariantsStore.getState().ensureMoves).not.toHaveBeenCalled();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('CP 1,498')).toBeInTheDocument();
    expect(screen.getByText('Level 39.5')).toBeInTheDocument();
    expect(screen.getByText('1 ready')).toBeInTheDocument();
    expect(screen.getByText(/1 fully detailed from 1 caught/)).toBeInTheDocument();
    expect(screen.queryByText('Clodsire')).not.toBeInTheDocument();
  });

  it('uses cached move data while a background move refresh is still running', () => {
    useAuthStore.setState({ isLoggedIn: true });
    useVariantsStore.setState({
      variants: [{
        variant_id: '0002-default',
        pokemon_id: 184,
        pokedex_number: 184,
        name: 'Azumarill',
        species_name: 'Azumarill',
        variantType: 'default',
        currentImage: '/images/my-azumarill.png',
        attack: 112,
        defense: 152,
        stamina: 225,
        moves: [
          {
            move_id: 1,
            name: 'Bubble',
            is_fast: 1,
            type_name: 'water',
            type: 'water',
            pvp_power: 8,
            pvp_energy: 11,
            pvp_turns: 3,
          },
          {
            move_id: 2,
            name: 'Play Rough',
            is_fast: 0,
            type_name: 'fairy',
            type: 'fairy',
            pvp_power: 90,
            pvp_energy: -60,
          },
          {
            move_id: 3,
            name: 'Ice Beam',
            is_fast: 0,
            type_name: 'ice',
            type: 'ice',
            pvp_power: 90,
            pvp_energy: -55,
          },
        ],
        fusion: [],
        crownForms: [],
        megaEvolutions: [],
      } as unknown as PokemonVariant],
      isMovesLoading: true,
    });
    useInstancesStore.setState({
      instances: {
        azu: {
          instance_id: 'azu',
          variant_id: '0002-default',
          pokemon_id: 184,
          nickname: 'Cached Blue',
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

    renderPvp();
    fireEvent.click(screen.getByRole('button', { name: 'My Pokémon' }));

    expect(screen.queryByText('Loading move data for your caught Pokémon...'))
      .not.toBeInTheDocument();
    expect(screen.getByText('Cached Blue')).toBeInTheDocument();
    expect(screen.getByText('1 ready')).toBeInTheDocument();
  });

  it('shows loading and source failure states without rendering stale rankings', () => {
    hookState.data = null;
    hookState.loading = true;
    const { rerender } = renderPvp();
    expect(screen.getByRole('status')).toHaveTextContent('Loading current rankings');

    hookState.loading = false;
    hookState.error = 'PvP rankings are temporarily unavailable.';
    rerender(<Pvp />);
    expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
