import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LinkedPokemonGrid from '@/pages/Search/views/ListViewComponents/LinkedPokemonGrid';

const entries = Array.from({ length: 8 }, (_, index) => ({
  id: `entry-${index}`,
  currentImage: `/images/${index}.png`,
  name: `Pokémon ${index + 1}`,
  dynamax: index === 0,
  gigantamax: index === 1,
  match: index === 2,
}));

describe('LinkedPokemonGrid', () => {
  it('summarizes large linked lists without rendering every entry', () => {
    render(
      <LinkedPokemonGrid
        title="Trainer wants"
        sectionClassName="wanted-list-section"
        gridClassName="wanted-list"
        containerClassName="wanted-pokemon-container"
        imageClassName="wanted-pokemon-image"
        entries={entries}
      />,
    );

    expect(screen.getByText('Trainer wants')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByAltText('Dynamax')).toBeInTheDocument();
    expect(screen.getByAltText('Gigantamax')).toBeInTheDocument();
    expect(screen.getByText('Mutual match')).toBeInTheDocument();
    expect(screen.getByText("+5 more in this trainer's listing")).toBeInTheDocument();
    expect(screen.queryByText('Pokémon 4')).not.toBeInTheDocument();
  });
});
