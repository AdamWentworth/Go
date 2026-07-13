import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import Raid from '@/pages/Raid/Raid';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move } from '@/types/pokemonSubTypes';

type RaidTestVariantOverrides = Omit<Partial<PokemonVariant>, 'moves' | 'raid_boss'> &
  Pick<PokemonVariant, 'name' | 'variant_id'> & {
    moves?: Move[];
    raid_boss?: unknown[];
  };

const mocks = vi.hoisted(() => ({
  storeState: {
    variants: [] as PokemonVariant[],
    variantsLoading: false,
  },
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: typeof mocks.storeState) => unknown) =>
    selector(mocks.storeState),
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading</div>,
}));

const move = (
  name: string,
  type: string,
  isFast: 0 | 1,
  power: number,
  cooldown: number,
  energy: number,
) =>
  ({
    name,
    type,
    type_name: type,
    is_fast: isFast,
    raid_power: power,
    raid_cooldown: cooldown,
    raid_energy: energy,
  }) as unknown as Move;

const variant = (overrides: RaidTestVariantOverrides): PokemonVariant =>
  ({
    pokemon_id: overrides.pokemon_id ?? 150,
    pokedex_number: overrides.pokedex_number ?? 150,
    name: overrides.name,
    species_name: overrides.species_name ?? overrides.name,
    attack: overrides.attack ?? 300,
    defense: overrides.defense ?? 182,
    stamina: overrides.stamina ?? 214,
    type_1_id: overrides.type_1_id ?? 15,
    type_2_id: overrides.type_2_id ?? 0,
    type1_name: overrides.type1_name ?? 'psychic',
    type2_name: overrides.type2_name ?? 'none',
    variantType: overrides.variantType ?? 'default',
    currentImage: overrides.currentImage ?? '/images/missing-pokemon.png',
    image_url: overrides.image_url ?? '',
    sprite_url: overrides.sprite_url ?? '',
    moves:
      overrides.moves ??
      [
        move('Confusion', 'psychic', 1, 20, 1600, 15),
        move('Psystrike', 'psychic', 0, 95, 2300, -50),
      ],
    raid_boss: (overrides.raid_boss ?? []) as unknown as PokemonVariant['raid_boss'],
    backgrounds: [],
    variant_id: overrides.variant_id,
  }) as unknown as PokemonVariant;

describe('Raid page', () => {
  beforeEach(() => {
    mocks.storeState.variantsLoading = false;
    mocks.storeState.variants = [
      variant({
        name: 'Mewtwo',
        variant_id: 'mewtwo-default',
        raid_boss: [
          {
            id: 1,
            tier: '5-star',
            min_unboosted_cp: 2294,
            max_unboosted_cp: 2387,
            min_boosted_cp: 2868,
            max_boosted_cp: 2984,
          },
        ],
      }),
      variant({
        name: 'Tyranitar',
        variant_id: 'tyranitar-default',
        pokemon_id: 248,
        pokedex_number: 248,
        attack: 251,
        defense: 207,
        stamina: 225,
        type_1_id: 16,
        type_2_id: 2,
        type1_name: 'rock',
        type2_name: 'dark',
        moves: [
          move('Bite', 'dark', 1, 6, 500, 4),
          move('Brutal Swing', 'dark', 0, 65, 1900, -33),
        ],
      }),
      variant({
        name: 'Gengar',
        variant_id: 'gengar-default',
        pokemon_id: 94,
        pokedex_number: 94,
        attack: 261,
        defense: 149,
        stamina: 155,
        type_1_id: 9,
        type_2_id: 14,
        type1_name: 'ghost',
        type2_name: 'poison',
        moves: [
          move('Lick', 'ghost', 1, 5, 500, 6),
          move('Shadow Ball', 'ghost', 0, 100, 3000, -50),
        ],
      }),
      variant({
        name: 'Raikou',
        variant_id: 'raikou-default',
        pokemon_id: 243,
        pokedex_number: 243,
        attack: 241,
        defense: 195,
        stamina: 207,
        type_1_id: 4,
        type_2_id: 0,
        type1_name: 'electric',
        type2_name: 'none',
        moves: [
          move('Thunder Shock', 'electric', 1, 5, 600, 8),
          move('Wild Charge', 'electric', 0, 90, 2600, -50),
        ],
        raid_boss: [
          {
            id: 2,
            tier: '5',
            min_unboosted_cp: 1889,
            max_unboosted_cp: 1972,
            min_boosted_cp: 2361,
            max_boosted_cp: 2466,
          },
        ],
      }),
      variant({
        name: 'Shiny Tyranitar',
        variant_id: 'tyranitar-shiny',
        pokemon_id: 248,
        pokedex_number: 248,
        variantType: 'shiny',
        moves: [
          move('Bite', 'dark', 1, 6, 500, 4),
          move('Brutal Swing', 'dark', 0, 65, 1900, -33),
        ],
      }),
    ];
  });

  it('renders loading spinner while variants are loading', () => {
    mocks.storeState.variantsLoading = true;

    render(<Raid />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders current raid mechanics and selects the metadata-backed raid tier', () => {
    render(<Raid />);

    expect(
      screen.getByRole('heading', {
        name: "Build a raid team around today's Gym raid rules.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('20 Trainers')).toBeInTheDocument();
    expect(screen.getByText('6 Pokemon')).toBeInTheDocument();
    expect(screen.getByText('Boss CP')).toBeInTheDocument();
    expect(screen.getAllByText('5-star').length).toBeGreaterThan(0);
    expect(screen.getByText('1889 - 1972')).toBeInTheDocument();
  });

  it('keeps raid boss choices hidden until searching', () => {
    render(<Raid />);

    expect(screen.queryByLabelText('Raid boss suggestions')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/find boss/i), {
      target: { value: 'raikou' },
    });

    const suggestions = screen.getByLabelText('Raid boss suggestions');
    fireEvent.click(within(suggestions).getByRole('button', { name: /raikou/i }));

    expect(screen.getByRole('heading', { name: 'Raikou' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Raid boss suggestions')).not.toBeInTheDocument();
  });

  it('supports current raid modifiers and filters eligible counter results', () => {
    render(<Raid />);

    fireEvent.click(screen.getByRole('button', { name: 'Shadow raid' }));
    expect(screen.getByText('Purified Gem reminder')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/counter search/i), {
      target: { value: 'tyranitar' },
    });

    const counterList = screen.getByLabelText('Raid counters');
    expect(within(counterList).getByText('Tyranitar')).toBeInTheDocument();
    expect(within(counterList).queryByText('Gengar')).not.toBeInTheDocument();
    expect(within(counterList).queryByText('Shiny Tyranitar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Best moves only' }));
    expect(screen.getByRole('button', { name: 'All move pairs' })).toBeInTheDocument();
  });
});
