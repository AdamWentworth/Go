import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FuseOverlay from '@/pages/Pokemon/features/instances/components/Caught/FuseOverlay';

describe('FuseOverlay', () => {
  const candidates = [
    {
      variant_id: '0643-default',
      pokemon_id: 643,
      name: 'Reshiram',
      species_name: 'Reshiram',
      currentImage: '/images/default/pokemon_643.png',
      image_url: '/images/default/pokemon_643.png',
      image_url_shiny: '/images/shiny/shiny_pokemon_643.png',
      image_url_shadow: '',
      image_url_shiny_shadow: '',
      instanceData: {
        instance_id: '0643-default_uuid-1',
        cp: 3100,
        level: 41,
        nickname: 'FusionOne',
        shiny: false,
      },
    },
    {
      variant_id: '0643-shiny',
      pokemon_id: 643,
      name: 'Reshiram',
      species_name: 'Reshiram',
      currentImage: '/images/shiny/shiny_pokemon_643.png',
      image_url: '/images/default/pokemon_643.png',
      image_url_shiny: '/images/shiny/shiny_pokemon_643.png',
      image_url_shadow: '',
      image_url_shiny_shadow: '',
      instanceData: {
        instance_id: '0643-shiny_uuid-2',
        cp: 2980,
        level: 39,
        nickname: null,
        shiny: true,
      },
    },
  ] as any;

  it('renders all candidate cards and allows selecting a different one', () => {
    const onSelectPokemon = vi.fn();

    render(
      <FuseOverlay
        candidates={candidates}
        selectedPokemon={candidates[0]}
        onSelectPokemon={onSelectPokemon}
        onClose={vi.fn()}
        onFuse={vi.fn()}
      />,
    );

    expect(screen.getByText('FusionOne')).toBeInTheDocument();
    expect(screen.getAllByText('Reshiram').length).toBeGreaterThanOrEqual(1);

    const secondCandidateStat = screen.getByText('CP 2980');
    fireEvent.click(secondCandidateStat.closest('button') as HTMLButtonElement);
    expect(onSelectPokemon).toHaveBeenCalledWith(candidates[1]);
  });

  it('calls fuse and close handlers from footer actions', () => {
    const onFuse = vi.fn();
    const onClose = vi.fn();

    render(
      <FuseOverlay
        candidates={candidates}
        selectedPokemon={candidates[0]}
        onSelectPokemon={vi.fn()}
        onClose={onClose}
        onFuse={onFuse}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fuse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onFuse).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
