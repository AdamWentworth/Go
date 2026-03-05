import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import SearchUI from '@/pages/Pokemon/components/Menus/PokemonMenu/SearchUI';

describe('SearchUI', () => {
  it('calls toggleEvolutionaryLine when the checkbox is changed', () => {
    const onSearchChange = vi.fn();
    const toggleEvolutionaryLine = vi.fn();

    render(
      <SearchUI
        searchTerm="bulbasaur"
        onSearchChange={onSearchChange}
        showEvolutionaryLine={false}
        toggleEvolutionaryLine={toggleEvolutionaryLine}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(toggleEvolutionaryLine).toHaveBeenCalledTimes(1);
  });

  it('does not render evolutionary toggle when search input is empty', () => {
    const onSearchChange = vi.fn();
    const toggleEvolutionaryLine = vi.fn();

    render(
      <SearchUI
        searchTerm=""
        onSearchChange={onSearchChange}
        showEvolutionaryLine={false}
        toggleEvolutionaryLine={toggleEvolutionaryLine}
      />,
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

