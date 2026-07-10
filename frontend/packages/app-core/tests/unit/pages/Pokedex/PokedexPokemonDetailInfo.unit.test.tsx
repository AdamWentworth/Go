import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  PokedexBattleTab,
  PokedexInfoTab,
} from '@/pages/Pokedex/PokedexPokemonDetailInfo';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

vi.mock('@/utils/imageHelpers', () => ({
  determineImageUrl: (_female: boolean, pokemon: PokemonVariant) =>
    pokemon.currentImage || pokemon.image_url,
  getTypeIconPath: (type: string) => `/types/${type.toLowerCase()}.png`,
}));

function makeMove(overrides: Partial<Move>): Move {
  return {
    move_id: 1,
    name: 'Tackle',
    type: 'Normal',
    type_name: 'Normal',
    is_fast: 1,
    pvp_power: 5,
    raid_power: 5,
    pvp_energy: 0,
    raid_energy: 0,
    legacy: false,
    ...overrides,
  } as Move;
}

function makePokemon(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    pokedex_number: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    form: null,
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    image_url: '/images/default/pokemon_1.png',
    type1_name: 'Grass',
    type2_name: 'Poison',
    type_1_icon: '/types/grass.png',
    type_2_icon: '/types/poison.png',
    attack: 118,
    defense: 111,
    stamina: 128,
    cp40: 1115,
    cp50: 1260,
    costumes: [],
    moves: [
      makeMove({ move_id: 1, name: 'Tackle', type: 'Normal', type_name: 'Normal', is_fast: 1 }),
      makeMove({
        move_id: 2,
        name: 'Vine Whip',
        type: 'Grass',
        type_name: 'Grass',
        is_fast: 1,
        pvp_power: 6,
        raid_power: 7,
      }),
      makeMove({
        move_id: 3,
        name: 'Sludge Bomb',
        type: 'Poison',
        type_name: 'Poison',
        is_fast: 0,
        pvp_power: 80,
        raid_power: 85,
        pvp_energy: -50,
        raid_energy: -50,
      }),
      makeMove({
        move_id: 4,
        name: 'Power Whip',
        type: 'Grass',
        type_name: 'Grass',
        is_fast: 0,
        pvp_power: 90,
        raid_power: 90,
        pvp_energy: -50,
        raid_energy: -50,
      }),
    ],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    max: [],
    evolves_from: [],
    evolves_to: [2],
    sizes: {
      pokedex_height: 0.7,
      pokedex_weight: 6.9,
      height_standard_deviation: 0.1,
      weight_standard_deviation: 1,
      height_xxs_threshold: 0.45,
      height_xs_threshold: 0.6,
      height_xl_threshold: 0.85,
      height_xxl_threshold: 1.05,
      weight_xxs_threshold: 4,
      weight_xs_threshold: 5.5,
      weight_xl_threshold: 8,
      weight_xxl_threshold: 10,
    },
    ...overrides,
  } as PokemonVariant;
}

describe('PokedexPokemonDetailInfo', () => {
  it('renders the tidied info tab with base stats, CP, size bands, and evolution', () => {
    const bulbasaur = makePokemon();
    const ivysaur = makePokemon({
      variant_id: '0002-default',
      pokemon_id: 2,
      pokedex_number: 2,
      name: 'Ivysaur',
      species_name: 'Ivysaur',
      currentImage: '/images/default/pokemon_2.png',
      image_url: '/images/default/pokemon_2.png',
      evolves_from: [1],
      evolves_to: [3],
    });
    const venusaur = makePokemon({
      variant_id: '0003-default',
      pokemon_id: 3,
      pokedex_number: 3,
      name: 'Venusaur',
      species_name: 'Venusaur',
      currentImage: '/images/default/pokemon_3.png',
      image_url: '/images/default/pokemon_3.png',
      evolves_from: [2],
      evolves_to: [],
    });
    const onShowMore = vi.fn();

    render(
      <PokedexInfoTab
        pokemon={bulbasaur}
        variants={[bulbasaur, ivysaur, venusaur]}
        onShowMore={onShowMore}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Base stats' })).toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('Stamina')).toBeInTheDocument();
    expect(screen.getByText('Level 40')).toBeInTheDocument();
    expect(screen.getByText('1115')).toBeInTheDocument();
    expect(screen.getByText('Level 50')).toBeInTheDocument();
    expect(screen.getByText('1260')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Size ranges' })).toBeInTheDocument();
    expect(screen.getByText('Normal average 6.9 kg')).toBeInTheDocument();
    expect(screen.getByText('Normal average 0.7 m')).toBeInTheDocument();
    expect(screen.getAllByText('XXS')).toHaveLength(2);
    expect(screen.getAllByText('XS')).toHaveLength(2);
    expect(screen.getAllByText('Normal')).toHaveLength(2);
    expect(screen.getAllByText('XL')).toHaveLength(2);
    expect(screen.getAllByText('XXL')).toHaveLength(2);
    expect(screen.getByText('>= 4 kg and < 5.5 kg')).toBeInTheDocument();
    expect(screen.getByText('> 1.05 m')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Evolution' })).toBeInTheDocument();
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByText('Ivysaur')).toBeInTheDocument();
    expect(screen.getByText('Venusaur')).toBeInTheDocument();

    screen.getByRole('button', { name: 'See all Bulbasaur' }).click();
    expect(onShowMore).toHaveBeenCalledTimes(1);
  });

  it('renders battle data as type effectiveness plus fast and charged move tables', () => {
    render(<PokedexBattleTab pokemon={makePokemon()} />);

    expect(screen.getByRole('heading', { name: 'Type effectiveness' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resistant to' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weak to' })).toBeInTheDocument();
    expect(screen.getAllByText('Grass').length).toBeGreaterThan(1);
    expect(screen.getByText('Poison')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Psychic')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Electric')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Fast attack' })).toBeInTheDocument();
    expect(screen.getByText('Tackle')).toBeInTheDocument();
    expect(screen.getByText('Vine Whip')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Charged attack' })).toBeInTheDocument();
    expect(screen.getByText('Sludge Bomb')).toBeInTheDocument();
    expect(screen.getByText('Power Whip')).toBeInTheDocument();
    expect(screen.getAllByLabelText('2 energy bars')).toHaveLength(2);
  });
});
