import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import SearchUI from '@/pages/Pokemon/components/Menus/PokemonMenu/SearchUI';

describe('SearchUI', () => {
  it('updates the input and search results callback immediately as the user types', () => {
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

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'p' } });
    expect(input).toHaveValue('p');
    expect(onSearchChange).toHaveBeenLastCalledWith('p');

    fireEvent.change(input, { target: { value: 'pi' } });
    expect(input).toHaveValue('pi');
    expect(onSearchChange).toHaveBeenLastCalledWith('pi');
    expect(onSearchChange).toHaveBeenCalledTimes(2);
  });

  it('syncs the input when the parent clears the search term', () => {
    const onSearchChange = vi.fn();
    const toggleEvolutionaryLine = vi.fn();
    const { rerender } = render(
      <SearchUI
        searchTerm="pikachu"
        onSearchChange={onSearchChange}
        showEvolutionaryLine={false}
        toggleEvolutionaryLine={toggleEvolutionaryLine}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('pikachu');

    rerender(
      <SearchUI
        searchTerm=""
        onSearchChange={onSearchChange}
        showEvolutionaryLine={false}
        toggleEvolutionaryLine={toggleEvolutionaryLine}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

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
