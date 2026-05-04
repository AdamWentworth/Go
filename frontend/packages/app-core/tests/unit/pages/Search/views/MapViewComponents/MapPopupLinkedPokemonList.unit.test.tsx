import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MapPopupLinkedPokemonList from '@/pages/Search/views/MapViewComponents/MapPopupLinkedPokemonList';

describe('MapPopupLinkedPokemonList', () => {
  it('renders matched images and no-match placeholders', () => {
    const findPokemonByKey = vi
      .fn()
      .mockReturnValueOnce({
        currentImage: '/images/bulbasaur.png',
        name: 'Bulbasaur',
        form: 'Fall',
      })
      .mockReturnValueOnce(null);

    const entries = {
      'variant-1_uuid-1': { match: true },
      'variant-2_uuid-2': { match: false },
    };

    const { container } = render(
      <MapPopupLinkedPokemonList
        title="Wanted Pokemon:"
        sectionClassName="wanted-list-section"
        listClassName="wanted-list"
        imageClassName="wanted-pokemon-image"
        entries={entries}
        findPokemonByKey={findPokemonByKey}
      />,
    );

    expect(container.querySelector('.wanted-list-section')).toBeInTheDocument();
    expect(container.querySelector('.wanted-list')).toBeInTheDocument();
    expect(screen.getByText('Wanted Pokemon:')).toBeInTheDocument();
    const image = screen.getByAltText('Bulbasaur');
    expect(image).toHaveAttribute('src', '/images/bulbasaur.png');
    expect(image).toHaveClass('wanted-pokemon-image');
    expect(image).toHaveClass('glowing-pokemon');
    expect(image).toHaveAttribute('title', 'Fall Bulbasaur');
    expect(screen.getByText('No match found')).toBeInTheDocument();
    expect(findPokemonByKey).toHaveBeenCalledWith(
      'variant-1_uuid-1',
      entries['variant-1_uuid-1'],
    );
    expect(findPokemonByKey).toHaveBeenCalledWith(
      'variant-2_uuid-2',
      entries['variant-2_uuid-2'],
    );
  });

  it('renders nothing when there are no entries', () => {
    const findPokemonByKey = vi.fn();

    const { container } = render(
      <MapPopupLinkedPokemonList
        title="Trade Pokemon:"
        sectionClassName="trade-list-section"
        listClassName="trade-list"
        imageClassName="trade-pokemon-image"
        entries={null}
        findPokemonByKey={findPokemonByKey}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(findPokemonByKey).not.toHaveBeenCalled();
  });
});
