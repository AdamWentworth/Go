import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PokemonCard from '@/pages/Pokemon/components/Menus/PokemonMenu/PokemonCard';

vi.mock('@/components/pokemonComponents/CP', () => ({
  default: () => <div data-testid="cp-component" />,
}));

vi.mock('@/pages/Pokemon/components/Menus/PokemonMenu/PokemonImagePresentation', () => ({
  default: () => <div data-testid="pokemon-image-presentation" />,
}));

vi.mock('@/pages/Pokemon/components/Menus/PokemonMenu/SelectChip', () => ({
  default: ({ onToggle }: { onToggle: () => void }) => (
    <button type="button" data-testid="select-chip" onClick={onToggle}>
      select
    </button>
  ),
}));

function makePokemon(overrides: Record<string, unknown> = {}) {
  return {
    pokemon_id: 1,
    name: 'Bulbasaur',
    variant_id: '0001-default',
    variantType: 'default',
    currentImage: '/images/1.png',
    pokedex_number: 1,
    cp50: 1115,
    type_1_icon: '/images/type-grass.png',
    type_2_icon: '/images/type-poison.png',
    type1_name: 'Grass',
    type2_name: 'Poison',
    attack: 118,
    defense: 111,
    stamina: 128,
    image_url: '/images/1.png',
    image_url_shadow: '/images/1-shadow.png',
    image_url_shiny: '/images/1-shiny.png',
    image_url_shiny_shadow: '/images/1-shiny-shadow.png',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    raid_boss: [],
    evolves_from: [],
    sizes: {
      pokedex_height: 0.7,
      pokedex_weight: 6.9,
      height_standard_deviation: 0.1,
      weight_standard_deviation: 0.1,
      height_xxs_threshold: 0.1,
      height_xs_threshold: 0.2,
      height_xl_threshold: 1.0,
      height_xxl_threshold: 1.2,
      weight_xxs_threshold: 1.0,
      weight_xs_threshold: 2.0,
      weight_xl_threshold: 10.0,
      weight_xxl_threshold: 12.0,
    },
    max: [],
    sprite_url: null,
    instanceData: {
      favorite: false,
    },
    ...overrides,
  } as unknown as React.ComponentProps<typeof PokemonCard>['pokemon'];
}

function renderCard(pokemonOverrides: Record<string, unknown> = {}) {
  const onSelect = vi.fn();
  const toggleCardHighlight = vi.fn();
  const setIsFastSelectEnabled = vi.fn();

  render(
    <PokemonCard
      pokemon={makePokemon(pokemonOverrides)}
      onSelect={onSelect}
      onSwipe={vi.fn()}
      toggleCardHighlight={toggleCardHighlight}
      setIsFastSelectEnabled={setIsFastSelectEnabled}
      isEditable={true}
      isFastSelectEnabled={false}
      isHighlighted={false}
      tagFilter=""
      sortType="name"
      variantByPokemonId={new Map()}
    />,
  );

  return { onSelect, toggleCardHighlight, setIsFastSelectEnabled };
}

describe('PokemonCard', () => {
  it('uses variant_id as fallback key for modifier-click selection', () => {
    const { toggleCardHighlight, setIsFastSelectEnabled } = renderCard({
      instanceData: {},
      variant_id: '0001-default',
    });

    const card = screen.getByRole('button', { name: /view bulbasaur details/i });
    fireEvent.click(card, { ctrlKey: true });

    expect(setIsFastSelectEnabled).toHaveBeenCalledWith(true);
    expect(toggleCardHighlight).toHaveBeenCalledWith('0001-default');
  });

  it('uses instance_id when present for keyboard selection and supports enter-to-open', () => {
    const { onSelect, toggleCardHighlight, setIsFastSelectEnabled } = renderCard({
      instanceData: { instance_id: 'instance-123' },
    });

    const card = screen.getByRole('button', { name: /view bulbasaur details/i });
    fireEvent.keyDown(card, { key: ' ' });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(setIsFastSelectEnabled).toHaveBeenCalledWith(true);
    expect(toggleCardHighlight).toHaveBeenCalledWith('instance-123');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
